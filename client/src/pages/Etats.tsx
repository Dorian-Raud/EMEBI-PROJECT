import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams, Navigate, Link } from 'react-router-dom'
import { invoicesRequester, declarationsFiscalesRequester, etatsRequester } from '../lib/api/requester'
import { useClient } from '../context/ClientContext'
import { Toast, makeToastId } from '../components/Toast'
import type { ToastItem } from '../components/Toast'
import { Pagination } from '../components/Pagination'
import { usePagination } from '../hooks/usePagination'
import { monthNames } from '../constants/period'
import './Etats.css'

const flowLabels: Record<string, string> = {
  INTRODUCTION: 'Introduction',
  EXPEDITION: 'Expédition',
  FISCALE: 'Fiscale'
}

interface NormalizedInvoice {
  id: string
  createdAt: string
  invoiceNumber: string
  month: number
  year: number
  flow: string
  partnerName: string
  partnerVat: string
  regime: string
  transactionNature: string
  totalHT: number
}

export default function Etats() {
  const { selectedCompany } = useClient()
  const companyId = selectedCompany?.id ?? ''
  const navigate = useNavigate()

  // Période choisie en amont (écran de sélection du client), transportée via l'URL
  const [searchParams] = useSearchParams()
  const month = Number(searchParams.get('month'))
  const year = Number(searchParams.get('year'))

  const [invoices, setInvoices] = useState<NormalizedInvoice[]>([])
  const [q, setQ] = useState('')
  const [flow, setFlow] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Toast
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (type: ToastItem['type'], message: string) =>
    setToasts((prev) => [...prev, { id: makeToastId(), type, message }])
  const removeToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  // Confirmation suppression
  const [confirmTarget, setConfirmTarget] = useState<NormalizedInvoice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)

    try {
      // On charge TOUTE la période (tous flux confondus) : le filtre flux/recherche
      // se fait ensuite côté client, et les compteurs par flux des boutons PDF
      // en découlent (indépendants des filtres du tableau).
      let standardList: NormalizedInvoice[] = []
      let fiscalList: NormalizedInvoice[] = []

      const resInv = await invoicesRequester.getAll(companyId, { month, year })
      if (resInv.ok && resInv.data) {
        standardList = resInv.data.map((inv: any) => ({
          id: inv.id,
          createdAt: inv.createdAt,
          invoiceNumber: inv.invoiceNumber,
          month: inv.declaration?.month ?? 1,
          year: inv.declaration?.year ?? 2026,
          flow: inv.declaration?.flow ?? 'INTRODUCTION',
          partnerName: inv.partner?.name ?? 'Inconnu',
          partnerVat: inv.partner?.vatNumber ?? '',
          regime: inv.regime,
          transactionNature: inv.transactionNature || 'N/A',
          totalHT: (inv.lines ?? []).reduce((sum: number, l: any) => sum + Number(l.value), 0)
        }))
      }

      const resFisc = await declarationsFiscalesRequester.getAll(companyId, { month, year })
      if (resFisc.ok && resFisc.data) {
        fiscalList = resFisc.data.map((fisc: any) => ({
          id: fisc.id,
          createdAt: fisc.createdAt,
          invoiceNumber: fisc.invoiceNumber,
          month: fisc.declaration?.month,
          year: fisc.declaration?.year,
          flow: 'FISCALE',
          partnerName: fisc.partner?.name ?? 'Inconnu',
          partnerVat: fisc.partner?.vatNumber ?? '',
          regime: fisc.regime,
          transactionNature: '—',
          totalHT: Number(fisc.value)
        }))
      }

      // Tri par date de saisie réelle (createdAt) : les plus récentes d'abord
      const combined = [...standardList, ...fiscalList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setInvoices(combined)
    } catch {
      setError('Impossible de charger les factures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [companyId, month, year])

  const handleEdit = (inv: NormalizedInvoice) => {
    if (inv.flow === 'INTRODUCTION') navigate(`/saisie/declaration/introduction?editId=${inv.id}`)
    else if (inv.flow === 'EXPEDITION') navigate(`/saisie/declaration/expedition?editId=${inv.id}`)
    else navigate(`/saisie/declaration-fiscale?editId=${inv.id}`)
  }

  const confirmAndDelete = async () => {
    if (!confirmTarget) return
    setDeleting(true)
    try {
      const res = confirmTarget.flow === 'FISCALE'
        ? await declarationsFiscalesRequester.delete(confirmTarget.id)
        : await invoicesRequester.delete(confirmTarget.id)

      if (res.ok || res.status === 204) {
        setInvoices((prev) => prev.filter((i) => i.id !== confirmTarget.id))
        addToast('success', `Facture n°${confirmTarget.invoiceNumber} supprimée.`)
      } else {
        addToast('error', 'Impossible de supprimer la facture.')
      }
    } catch {
      addToast('error', 'Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
      setConfirmTarget(null)
    }
  }

  // Filtres client-side instantanés (la période est déjà bornée en amont)
  const displayed = useMemo(() => {
    const term = q.trim().toLowerCase()
    return invoices.filter((inv) =>
      (flow === '' || inv.flow === flow) &&
      (term === '' ||
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.partnerName.toLowerCase().includes(term) ||
        inv.partnerVat.toLowerCase().includes(term))
    )
  }, [invoices, q, flow])

  // Nombre de factures par flux sur la période (pour les boutons PDF), indépendant des filtres
  const counts = useMemo(() => {
    const c: Record<string, number> = { INTRODUCTION: 0, EXPEDITION: 0, FISCALE: 0 }
    invoices.forEach((inv) => { c[inv.flow] = (c[inv.flow] ?? 0) + 1 })
    return c
  }, [invoices])

  const { paged, page, setPage, pageCount, total } = usePagination(displayed, 10)

  if (!selectedCompany) return null
  // Garde-fou : sans période valide dans l'URL, on renvoie au choix client + période
  if (!month || !year) return <Navigate to="/etats" replace />

  const openPdf = (f: string) =>
    window.open(etatsRequester.pdfUrl(companyId, month, year, f), '_blank')

  const pdfButtons = [
    { flow: 'INTRODUCTION', label: 'État Introduction' },
    { flow: 'EXPEDITION', label: 'État Expédition' },
    { flow: 'FISCALE', label: 'État Déclaration fiscale' },
  ]

  return (
    <div className="EtatsPage">
      <h1 className="EtatsTitle">États — factures saisies</h1>
      <p className="EtatsSubtitle">
        Client : <b>{selectedCompany.name}</b> · Période : <b>{monthNames[month - 1]} {year}</b>
        <Link to="/etats" className="EtatsChangePeriod">← Changer de période</Link>
      </p>

      <div className="EtatsFilters">
        <input
          className="EtatsInput"
          placeholder="Rechercher (n° facture, tiers, TVA…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="EtatsSelect" value={flow} onChange={(e) => setFlow(e.target.value)}>
          <option value="">Tous les flux</option>
          <option value="INTRODUCTION">Introduction</option>
          <option value="EXPEDITION">Expédition</option>
          <option value="FISCALE">Fiscale</option>
        </select>
      </div>

      <div className="EtatsPdfBar">
        <span className="EtatsPdfBarLabel">Générer un état :</span>
        {pdfButtons.map((b) => {
          const count = counts[b.flow] ?? 0
          const disabled = count === 0
          return (
            <button
              key={b.flow}
              type="button"
              className="EtatsPdfBtn"
              disabled={disabled}
              title={
                disabled
                  ? `Aucune facture ${flowLabels[b.flow]} pour ${monthNames[month - 1]} ${year}`
                  : `Générer l'état ${flowLabels[b.flow]} (${count} facture${count > 1 ? 's' : ''})`
              }
              onClick={() => openPdf(b.flow)}
            >
              📄 {b.label}
            </button>
          )
        })}
      </div>

      {error ? <p className="EtatsError">{error}</p> : null}

      {loading ? (
        <p className="EtatsEmpty">Chargement…</p>
      ) : total === 0 ? (
        <p className="EtatsEmpty">Aucune facture pour ces critères.</p>
      ) : (
        <div className="EtatsTableWrap">
          <table className="EtatsTable">
            <thead>
              <tr>
                <th>N° facture</th>
                <th>Période</th>
                <th>Flux</th>
                <th>Tiers</th>
                <th>Régime</th>
                <th>Nature</th>
                <th>Total HT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paged.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{String(inv.month).padStart(2, '0')}/{inv.year}</td>
                  <td>{flowLabels[inv.flow] ?? inv.flow}</td>
                  <td>
                    {inv.partnerName}
                    <span className="EtatsMuted"> · {inv.partnerVat}</span>
                  </td>
                  <td>{inv.regime}</td>
                  <td>{inv.transactionNature}</td>
                  <td>{inv.totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                  <td className="EtatsActions">
                    <button
                      className="EtatsActionBtn EtatsActionBtn--edit"
                      title="Modifier"
                      onClick={() => handleEdit(inv)}
                    >
                      ✏️
                    </button>
                    <button
                      className="EtatsActionBtn EtatsActionBtn--delete"
                      title="Supprimer"
                      onClick={() => setConfirmTarget(inv)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            total={total}
            page={page}
            pageCount={pageCount}
            onPageChange={setPage}
            itemLabel="facture"
          />
        </div>
      )}

      {/* Modal de confirmation suppression */}
      {confirmTarget ? (
        <div className="EtatsOverlay" onClick={() => !deleting && setConfirmTarget(null)}>
          <div className="EtatsConfirmModal" onClick={(e) => e.stopPropagation()}>
            <p className="EtatsConfirmTitle">Supprimer cette facture ?</p>
            <p className="EtatsConfirmDesc">
              <b>N°{confirmTarget.invoiceNumber}</b> — {confirmTarget.partnerName}
              <br />
              Cette action est irréversible.
            </p>
            <div className="EtatsConfirmActions">
              <button
                className="EtatsBtn EtatsBtn--secondary"
                onClick={() => setConfirmTarget(null)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                className="EtatsBtn EtatsBtn--danger"
                onClick={confirmAndDelete}
                disabled={deleting}
              >
                {deleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Toast toasts={toasts} onClose={removeToast} />
    </div>
  )
}
