import { useEffect, useState } from 'react'
import { companiesRequester, type Company } from '../lib/api/requester'
import { Link } from 'react-router-dom'
import './Tiers.css'

export default function Tiers() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', siret: '', vatNumber: '' })

  useEffect(() => {
    const fetchCompanies = async () => {
      const res = await companiesRequester.getAll()
      if (res.ok && res.data) setCompanies(res.data)
    }
    fetchCompanies()
  }, [])

  const handleCreate = async () => {
    const res = await companiesRequester.create(form)
    if (res.ok && res.data) {
      setCompanies((prev) => [...prev, res.data])
      setForm({ name: '', siret: '', vatNumber: '' })
      setShowForm(false)
    } else {
      // eslint-disable-next-line no-console
      console.error(res.message)
    }
  }

  return (
    <div className="TiersPage">
      <div className="TiersHeader">
        <h1 className="TiersTitle">Tiers</h1>
        <Link to="/" className="TiersBackLink">
          Retour
        </Link>
      </div>

      <p className="TiersHint">Gestion des sociétés (prémices).</p>

      <button
        type="button"
        onClick={() => setShowForm((v) => !v)}
        className="TiersPrimaryBtn"
      >
        Ajoutez une société
      </button>

      {showForm ? (
        <div className="TiersPanel">
          <div className="TiersFormGrid">
            <input
              className="TiersInput"
              placeholder="Nom"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="TiersInput"
              placeholder="SIRET"
              value={form.siret}
              onChange={(e) => setForm((prev) => ({ ...prev, siret: e.target.value }))}
            />
            <input
              className="TiersInput"
              placeholder="N° TVA"
              value={form.vatNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, vatNumber: e.target.value }))}
            />
          </div>

          <div className="TiersActions">
            <button
              type="button"
              onClick={handleCreate}
              className="TiersPrimaryBtn"
            >
              Créer
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="TiersSecondaryBtn"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      <div className="TiersList">
        {companies.map((company) => (
          <div
            key={company.id}
            className="TiersCard"
          >
            <div className="TiersCardTitle">{company.name}</div>
            <div className="TiersCardMeta">
              SIRET: {company.siret} — TVA: {company.vatNumber}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

