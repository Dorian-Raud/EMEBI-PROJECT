import { useEffect, useState } from 'react'
import { invoicesRequester } from '../lib/api/requester'
import type { InvoiceSummary } from '../types'
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
                <th>Période</th>
                <th>Flux</th>
                <th>Tiers</th>
                <th>Régime</th>
                <th>Nature</th>
                <th>Total HT</th>
              </tr>
            </thead>
            {invoices.map((inv) => {
              console.log("lines:", inv.lines)
              return (
                <tr key={inv.id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>
                    {String(inv.declaration.month).padStart(2, '0')}/{inv.declaration.year}
                  </td>
                  <td>{flowLabels[inv.declaration.flow] ?? inv.declaration.flow}</td>
                  <td>
                    {inv.partner.name}
                    <span className="EtatsMuted"> · {inv.partner.vatNumber}</span>
                  </td>
                  <td>{inv.regime}</td>
                  <td>{inv.transactionNature}</td>
                  <td>
                    {inv.lines
                      .reduce((sum, l) => sum + Number(l.value), 0)
                      .toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </td>
                </tr>
              )
            })}
          </table>
        </div>
      )}
    </div>
  )
}
