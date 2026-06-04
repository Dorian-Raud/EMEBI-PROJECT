import { Link } from 'react-router-dom'
import './Home.css'

const tiles = [
  {
    to: '/saisie',
    icon: '📝',
    title: 'Saisie d\u2019une déclaration',
    description: 'Créer une déclaration fiscale, d\u2019introduction ou d\u2019expédition.',
  },
  {
    to: '/etats',
    icon: '📊',
    title: 'États clients',
    description: 'Consulter la synthèse des factures enregistrées.',
  },
  {
    to: '/declarations-clients',
    icon: '📋',
    title: 'Déclarations clients',
    description: 'Voir et gérer les déclarations existantes.',
  },
  {
    to: '/gestion',
    icon: '⚙️',
    title: 'Gestion',
    description: 'Paramètres, tiers et administration.',
  },
] as const

export default function Home() {
  return (
    <div className="HomePage">
      <header className="HomeHeader">
        <div className="HomeLogo">EMEBI</div>
        <p className="HomeSubtitle">
          Gestion des déclarations d'échanges de biens intra-UE
        </p>
      </header>

      <div className="HomeGrid">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="HomeCard">
            <span className="HomeCardIcon">{t.icon}</span>
            <h2 className="HomeCardTitle">{t.title}</h2>
            <p className="HomeCardDesc">{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
