import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { companiesRequester } from '../lib/api/requester'
import type { Company } from '../types'
import { useClient } from '../context/ClientContext'
import { monthNames, recentYears } from '../constants/period'
import './SelectClient.css'

type SelectClientProps = {
  /** Where to navigate after a client is selected */
  nextPath?: string
  /** Whether to show the "Ajouter un client" form (default true) */
  showCreate?: boolean
  /** Whether to require a period (month/year) before continuing — used by the États flow */
  requirePeriod?: boolean
}

const now = new Date()
const years = recentYears()

export default function SelectClient({ nextPath = '/saisie/declarations', showCreate = true, requirePeriod = false }: SelectClientProps) {
  const navigate = useNavigate()
  const { selectCompany } = useClient()

  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', siret: '', vatNumber: '' })
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  // Construit la cible de navigation, en ajoutant la période choisie si requise
  const buildTarget = () =>
    requirePeriod ? `${nextPath}?month=${month}&year=${year}` : nextPath

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
      navigate(buildTarget())
    }
  }

  const handleSelect = (company: Company) => {
    selectCompany(company)
    navigate(buildTarget())
  }

  const filtered = companies.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.siret.toLowerCase().includes(q) ||
      c.vatNumber.toLowerCase().includes(q)
    )
  })

  return (
    <div className="SelectClientPage">
      <h1 className="SelectClientTitle">Choisir un client</h1>


      {requirePeriod ? (
        <div className="SelectClientPeriod">
          <span className="SelectClientPeriodLabel">Période :</span>
          <select
            className="SelectClientPeriodSelect"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            className="SelectClientPeriodSelect"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="SelectClientToolbar">
        <div className="SelectClientSearchWrap">
          <span className="SelectClientSearchIcon"></span>
          <input
            className="SelectClientSearchInput"
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {showCreate ? (
          <button type="button" className="SelectClientPrimaryBtn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Annuler' : 'Ajouter un client'}
          </button>
        ) : null}
      </div>

      {error ? <p className="SelectClientError">{error}</p> : null}

      {showCreate && showForm ? (
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
        {filtered.map((c) => (
          <button key={c.id} type="button" className="SelectClientCard" onClick={() => handleSelect(c)}>
            <div className="SelectClientCardTitle">{c.name}</div>
            <div className="SelectClientCardMeta">
              SIRET {c.siret} — TVA {c.vatNumber}
            </div>
          </button>
        ))}
        {!filtered.length && search.trim() ? (
          <p className="SelectClientEmpty">Aucun client ne correspond à « {search} ».</p>
        ) : null}
        {!companies.length && !showForm ? (
          <p className="SelectClientEmpty">Aucun client. Crée-en un pour commencer.</p>
        ) : null}
      </div>
    </div>
  )
}
