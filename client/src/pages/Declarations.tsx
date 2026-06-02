import { Link } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
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
  const { selectedCompany } = useClient()

  return (
    <div className="DeclarationsPage">
      <div className="DeclarationsHeader">
        <h1 className="DeclarationsTitle">Déclarations</h1>
      </div>

      {selectedCompany ? (
        <p className="DeclarationsClientBanner">
          Client : <b>{selectedCompany.name}</b> — TVA {selectedCompany.vatNumber}
        </p>
      ) : null}

      <p className="DeclarationsHint">
        Sélectionne un type de déclaration pour accéder au formulaire correspondant.
      </p>

      <div className="DeclarationsGrid">
        {options.map((o) => (
          <Link key={o.key} to={`/client/declaration/${o.key}`} className="DeclarationsCard">
            <h2 className="DeclarationsCardTitle">{o.title}</h2>
            <p>{o.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
