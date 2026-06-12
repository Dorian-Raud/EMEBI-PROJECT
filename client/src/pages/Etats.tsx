import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invoicesRequester, declarationsFiscalesRequester } from '../lib/api/requester'
import { useClient } from '../context/ClientContext'
import { Toast, makeToastId } from '../components/Toast'
import type { ToastItem } from '../components/Toast'
import './Etats.css'

const flowLabels: Record<string, string> = {
  INTRODUCTION: 'Introduction',
  EXPEDITION: 'Expédition',
  FISCALE: 'Fiscale'
}

interface NormalizedInvoice {
  id: string
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
      let standardList: NormalizedInvoice[] = []
      let fiscalList: NormalizedInvoice[] = []
      const searchTerms = q.trim().toLowerCase()

      if (flow !== 'FISCALE') {
        const res = await invoicesRequester.getAll(companyId, {
          q: searchTerms || undefined,
          flow: flow || undefined,
        })
        if (res.ok && res.data) {
          standardList = res.data.map((inv: any) => ({
            id: inv.id,
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
      }

      if (flow === '' || flow === 'FISCALE') {
        const res = await declarationsFiscalesRequester.getAll(companyId)
        if (res.ok && res.data) {
          let rawFiscal = res.data
          if (searchTerms) {
            rawFiscal = rawFiscal.filter((fisc: any) =>
              fisc.invoiceNumber.toLowerCase().includes(searchTerms) ||
              (fisc.partner?.name ?? '').toLowerCase().includes(searchTerms) ||
              (fisc.partner?.vatNumber ?? '').toLowerCase().includes(searchTerms)
            )
          }
          fiscalList = rawFiscal.map((fisc: any) => ({
            id: fisc.id,
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
      }

      const combined = [...standardList, ...fiscalList].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1).getTime()
        const dateB = new Date(b.year, b.month - 1).getTime()
        return dateB - dateA
      })

      setInvoices(combined)
    } catch {
      setError('Impossible de charger les factures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [companyId])

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

  if (!selectedCompany) return null

  return (
    <div className="EtatsPage">
      <h1 className="EtatsTitle">États — factures saisies</h1>
      <p className="EtatsSubtitle">Client : <b>{selectedCompany.name}</b></p>

      <div className="EtatsFilters">
        <input
          className="EtatsInput"
          placeholder="Rechercher (n° facture, tiers, TVA…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') load() }}
        />
        <select className="EtatsSelect" value={flow} onChange={(e) => setFlow(e.target.value)}>
          <option value="">Tous les flux</option>
          <option value="INTRODUCTION">Introduction</option>
          <option value="EXPEDITION">Expédition</option>
          <option value="FISCALE">Fiscale</option>
        </select>
        <button type="button" className="EtatsSearchBtn" onClick={load} disabled={loading}>
          {loading ? 'Chargement…' : 'Rechercher'}
        </button>
      </div>

      {error ? <p className="EtatsError">{error}</p> : null}

      {invoices.length === 0 && !loading ? (
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
              {invoices.map((inv) => (
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
