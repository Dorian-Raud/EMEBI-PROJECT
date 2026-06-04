import { useClient } from '../context/ClientContext'

export default function DeclarationsList() {
  const { selectedCompany } = useClient()

  if (!selectedCompany) return null

  return (
    <div style={{ padding: '24px', textAlign: 'left' }}>
      <h1>Déclarations clients</h1>
      <p>
        Client : <b>{selectedCompany.name}</b>
      </p>
      <p>
        (En cours de construction : Liste et gestion des déclarations existantes)
      </p>
    </div>
  )
}
