import { useEffect, useState } from 'react'
import { invoicesRequester, type InvoiceSummary } from '../lib/api/requester'
import { useClient } from '../context/ClientContext'
import './Etats.css'

const flowLabels: Record<string, string> = {
  INTRODUCTION: 'Introduction',
  EXPEDITION: 'Expédition',
}

export default function Etats() {
  const { selectedCompany } = useClient()
  const companyId = selectedCompany?.id ?? ''

  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [q, setQ] = useState('')
  const [flow, setFlow] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)
    const res = await invoicesRequester.getAll(companyId, {
      q: q.trim() || undefined,
      flow: flow || undefined,
    })
    setLoading(false)
    if (!res.ok) {
      setError('Impossible de charger les factures.')
      return
    }
    setInvoices(res.data ?? [])
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
                <th>Date</th>
                <th>Flux</th>
                <th>Période</th>
                <th>Tiers</th>
                <th>Lignes</th>
                <th>Régime</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>
                    {inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString('fr-FR')
                      : '—'}
                  </td>
                  <td>{flowLabels[inv.declaration.flow] ?? inv.declaration.flow}</td>
                  <td>
                    {String(inv.declaration.month).padStart(2, '0')}/{inv.declaration.year}
                  </td>
                  <td>
                    {inv.partner.name}
                    <span className="EtatsMuted"> · {inv.partner.vatNumber}</span>
                  </td>
                  <td>{inv.lines.length}</td>
                  <td>{inv.regime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
