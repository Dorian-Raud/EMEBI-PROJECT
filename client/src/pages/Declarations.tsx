import { Link } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import './Declarations.css'

const options = [
  {
    key: 'fiscale',
    title: 'Déclaration fiscale',
    description: 'Flux fiscal',
    path: '/saisie/declaration-fiscale', // <-- Chemin personnalisé pour le fiscal
  },
  {
    key: 'introduction',
    title: 'Déclaration d’introduction',
    description: 'Entrée de biens sur le territoire',
    path: '/saisie/declaration/introduction', // <-- Chemin classique douane
  },
  {
    key: 'expedition',
    title: 'Déclaration d’expédition',
    description: 'Sortie de biens vers un autre État membre',
    path: '/saisie/declaration/expedition', // <-- Chemin classique douane
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
        Sélectionnez un type de déclaration pour accéder au formulaire correspondant.
      </p>

      <div className="DeclarationsGrid">
        {options.map((o) => (
          /* On utilise directement o.path au lieu de reconstruire l'URL à la main */
          <Link key={o.key} to={o.path} className="DeclarationsCard">
            <h2 className="DeclarationsCardTitle">{o.title}</h2>
            <p>{o.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}