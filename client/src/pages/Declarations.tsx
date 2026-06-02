import { Link } from 'react-router-dom'
import './Declarations.css'

const options = [
  {
    key: 'fiscale',
    title: 'Déclaration fiscale',
    description: 'Flux fiscal / statistique',
  },
  {
    key: 'introduction',
    title: 'Déclaration d’introduction',
    description: 'Entrée de biens sur le territoire',
  },
  {
    key: 'expedition',
    title: 'Déclaration d’expédition',
    description: 'Sortie de biens vers un autre État membre',
  },
] as const

export default function Declarations() {
  return (
    <div className="DeclarationsPage">
      <div className="DeclarationsHeader">
        <h1 className="DeclarationsTitle">Déclarations</h1>
        <Link to="/tiers" className="DeclarationsTopLink">
          Tiers
        </Link>
      </div>
      <p className="DeclarationsHint">
        Sélectionne un type de déclaration pour accéder au formulaire correspondant.
      </p>

      <div className="DeclarationsGrid">
        {options.map((o) => (
          <Link
            key={o.key}
            to={`/declaration/${o.key}`}
            className="DeclarationsCard"
          >
            <h2 className="DeclarationsCardTitle">{o.title}</h2>
            <p>{o.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}