import { Link } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import './ClientHome.css'

const tiles = [
  {
    to: '/client/declarations',
    title: 'Déclarations',
    description: 'Saisir des factures (introduction, expédition, fiscale).',
  },
  {
    to: '/client/etats',
    title: 'États clients',
    description: 'Synthèse des factures enregistrées pour ce client.',
  },
  {
    to: '/client/tiers',
    title: 'Gestion des tiers',
    description: 'Créer et consulter les partenaires du client.',
  },
] as const

export default function ClientHome() {
  const { selectedCompany } = useClient()

  if (!selectedCompany) return null

  return (
    <div className="ClientHomePage">
      <h1 className="ClientHomeTitle">Espace client</h1>
      <p className="ClientHomeSubtitle">
        Client : <b>{selectedCompany.name}</b> — TVA {selectedCompany.vatNumber}
      </p>
      <p className="ClientHomeHint">
        Choisis une rubrique pour continuer. Les factures validées en saisie apparaissent dans les états.
      </p>

      <div className="ClientHomeGrid">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="ClientHomeCard">
            <h2 className="ClientHomeCardTitle">{t.title}</h2>
            <p>{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
