import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { partnersRequester, type Partner } from '../lib/api/requester'
import { useClient } from '../context/ClientContext'
import './Tiers.css'

function deriveCountryCodeFromVat(vat: string) {
  const v = vat.trim().toUpperCase()
  const match = v.match(/^([A-Z]{2})/)
  return match ? match[1] : ''
}

export default function Tiers() {
  const { selectedCompany } = useClient()
  const companyId = selectedCompany?.id ?? ''

  const [partners, setPartners] = useState<Partner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', vatNumber: '', isoCode: '' })
  const [error, setError] = useState<string | null>(null)

  const loadPartners = async () => {
    const res = await partnersRequester.getAll(companyId)
    if (res.ok && res.data) setPartners(res.data)
  }

  useEffect(() => {
    loadPartners()
  }, [companyId])

  const handleCreate = async () => {
    setError(null)
    const res = await partnersRequester.create({
      name: form.name.trim(),
      vatNumber: form.vatNumber.trim(),
      isoCode: form.isoCode.trim().toUpperCase(),
      companyId,
    })
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('Erreur création tiers:', res)
      setError('Impossible de créer le tiers.')
      return
    }
    if (res.data) {
      setPartners((prev) => [res.data, ...prev])
      setForm({ name: '', vatNumber: '', isoCode: '' })
      setShowForm(false)
    }
  }

  if (!selectedCompany) return null

  return (
    <div className="TiersPage">
      <div className="TiersHeader">
        <h1 className="TiersTitle">Tiers</h1>
      </div>

      <p className="TiersHint">
        Tiers du client <b>{selectedCompany.name}</b> (TVA {selectedCompany.vatNumber}).
      </p>

      <button type="button" onClick={() => setShowForm((v) => !v)} className="TiersPrimaryBtn">
        {showForm ? 'Annuler' : 'Ajouter un tiers'}
      </button>

      {error ? <p className="TiersError">{error}</p> : null}

      {showForm ? (
        <div className="TiersPanel">
          <div className="TiersFormGrid">
            <input
              className="TiersInput"
              placeholder="Nom *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="TiersInput"
              placeholder="N° TVA *"
              value={form.vatNumber}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  vatNumber: e.target.value,
                  isoCode: p.isoCode || deriveCountryCodeFromVat(e.target.value),
                }))
              }
            />
            <input
              className="TiersInput"
              placeholder="Pays ISO *"
              value={form.isoCode}
              onChange={(e) => setForm((p) => ({ ...p, isoCode: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="TiersActions">
            <button
              type="button"
              onClick={handleCreate}
              className="TiersPrimaryBtn"
              disabled={!form.name.trim() || !form.vatNumber.trim() || !form.isoCode.trim()}
            >
              Créer
            </button>
          </div>
        </div>
      ) : null}

      <div className="TiersList">
        {partners.map((p) => (
          <div key={p.id} className="TiersCard">
            <div className="TiersCardTitle">{p.name}</div>
            <div className="TiersCardMeta">
              TVA {p.vatNumber} — Pays {p.isoCode}
            </div>
          </div>
        ))}
        {!partners.length && !showForm ? <p className="TiersEmpty">Aucun tiers pour ce client.</p> : null}
      </div>
    </div>
  )
}
