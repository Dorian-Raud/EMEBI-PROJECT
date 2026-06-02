import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { companiesRequester, type Company } from '../lib/api/requester'
import { useClient } from '../context/ClientContext'
import './SelectClient.css'

export default function SelectClient() {
  const navigate = useNavigate()
  const { selectCompany } = useClient()

  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', siret: '', vatNumber: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const res = await companiesRequester.getAll()
      if (res.ok && res.data) setCompanies(res.data)
    }
    load()
  }, [])

  const handleCreate = async () => {
    setError(null)
    const res = await companiesRequester.create(form)
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.error('Erreur création client:', res)
      setError('Impossible de créer le client.')
      return
    }
    if (res.data) {
      setCompanies((prev) => [...prev, res.data])
      setForm({ name: '', siret: '', vatNumber: '' })
      setShowForm(false)
      selectCompany(res.data)
      navigate('/client')
    }
  }

  const handleSelect = (company: Company) => {
    selectCompany(company)
    navigate('/client')
  }

  return (
    <div className="SelectClientPage">
      <h1 className="SelectClientTitle">Choisir un client</h1>
      <p className="SelectClientHint">
        Sélectionne le client pour lequel tu vas saisir des déclarations, factures et tiers.
      </p>

      <button type="button" className="SelectClientPrimaryBtn" onClick={() => setShowForm((v) => !v)}>
        {showForm ? 'Annuler' : 'Créer un client'}
      </button>

      {error ? <p className="SelectClientError">{error}</p> : null}

      {showForm ? (
        <div className="SelectClientPanel">
          <div className="SelectClientFormGrid">
            <input
              className="SelectClientInput"
              placeholder="Nom *"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="SelectClientInput"
              placeholder="SIRET *"
              value={form.siret}
              onChange={(e) => setForm((p) => ({ ...p, siret: e.target.value }))}
            />
            <input
              className="SelectClientInput"
              placeholder="N° TVA *"
              value={form.vatNumber}
              onChange={(e) => setForm((p) => ({ ...p, vatNumber: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="SelectClientPrimaryBtn"
            disabled={!form.name.trim() || !form.siret.trim() || !form.vatNumber.trim()}
            onClick={handleCreate}
          >
            Créer et continuer
          </button>
        </div>
      ) : null}

      <div className="SelectClientList">
        {companies.map((c) => (
          <button key={c.id} type="button" className="SelectClientCard" onClick={() => handleSelect(c)}>
            <div className="SelectClientCardTitle">{c.name}</div>
            <div className="SelectClientCardMeta">
              SIRET {c.siret} — TVA {c.vatNumber}
            </div>
          </button>
        ))}
        {!companies.length && !showForm ? (
          <p className="SelectClientEmpty">Aucun client. Crée-en un pour commencer.</p>
        ) : null}
      </div>
    </div>
  )
}
