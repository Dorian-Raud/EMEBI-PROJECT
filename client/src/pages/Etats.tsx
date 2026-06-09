import { useEffect, useState } from 'react'
import { invoicesRequester, declarationsFiscalesRequester } from '../lib/api/requester' // <-- Ajout du requester fiscal
import { useClient } from '../context/ClientContext'
import './Etats.css'

const flowLabels: Record<string, string> = {
  INTRODUCTION: 'Introduction',
  EXPEDITION: 'Expédition',
  FISCALE: 'Fiscale'
}

// On définit une structure commune pour notre tableau du Front
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

  // L'état stocke maintenant notre liste harmonisée
  const [invoices, setInvoices] = useState<NormalizedInvoice[]>([])
  const [q, setQ] = useState('')
  const [flow, setFlow] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)

    try {
      let standardList: NormalizedInvoice[] = []
      let fiscalList: NormalizedInvoice[] = []
      const searchTerms = q.trim().toLowerCase()

      // 1. CHARGEMENT DES FACTURES DOUANES (Intro / Expé)
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
            // Somme des lignes pour la douane
            totalHT: (inv.lines ?? []).reduce((sum: number, l: any) => sum + Number(l.value), 0)
          }))
        }
      }

      // 2. CHARGEMENT DES DÉCLARATIONS FISCALES
      if (flow === '' || flow === 'FISCALE') {
        const res = await declarationsFiscalesRequester.getAll(companyId)
        if (res.ok && res.data) {
          let rawFiscal = res.data

          // Filtrage "confort" côté Front sur la recherche textuelle (q) pour le fiscal
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
            month: fisc.month,
            year: fisc.year,
            flow: 'FISCALE',
            partnerName: fisc.partner?.name ?? 'Inconnu',
            partnerVat: fisc.partner?.vatNumber ?? '',
            regime: fisc.regime,
            transactionNature: '—', // Pas de nature de transaction en fiscal
            // Valeur directe pour le fiscal
            totalHT: Number(fisc.value) 
          }))
        }
      }

      // 3. FUSION ET TRI (par date la plus récente)
      const combined = [...standardList, ...fiscalList].sort((a, b) => {
        const dateA = new Date(a.year, a.month - 1).getTime()
        const dateB = new Date(b.year, b.month - 1).getTime()
        return dateB - dateA
      })

      setInvoices(combined)
    } catch (err) {
      setError('Impossible de charger les factures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [companyId])

  if (!selectedCompany) return null

  return (
    <div className="EtatsPage">
      <h1 className="EtatsTitle">États — factures saisies</h1>
      <p className="EtatsSubtitle">
        Client : <b>{selectedCompany.name}</b>
      </p>

      <div className="EtatsFilters">
        <input
          className="EtatsInput"
          placeholder="Rechercher (n° facture, tiers, TVA…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') load()
          }}
        />
        <select
          className="EtatsSelect"
          value={flow}
          onChange={(e) => setFlow(e.target.value)}
        >
          <option value="">Tous les flux</option>
          <option value="INTRODUCTION">Introduction</option>
          <option value="EXPEDITION">Expédition</option>
          <option value="FISCALE">Fiscale</option> {/* <-- L'OPTION AJOUTÉE */}
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
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>
                    {String(inv.month).padStart(2, '0')}/{inv.year}
                  </td>
                  <td>{flowLabels[inv.flow] ?? inv.flow}</td>
                  <td>
                    {inv.partnerName}
                    <span className="EtatsMuted"> · {inv.partnerVat}</span>
                  </td>
                  <td>{inv.regime}</td>
                  <td>{inv.transactionNature}</td>
                  <td>
                    {inv.totalHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}