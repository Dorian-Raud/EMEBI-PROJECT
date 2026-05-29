import { useState, useEffect } from 'react'
import { companiesRequester, type Company } from './lib/api/requester.ts'

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", siret: "", vatNumber: "" });

  useEffect(() => {
    const fetchCompanies = async () => {
      const res = await companiesRequester.getAll();
      if (res.ok && res.data) setCompanies(res.data);
    };
    fetchCompanies();
  }, []);

  const handleCreate = async () => {
    const res = await companiesRequester.create(form);
    if (res.ok && res.data) {
      setCompanies(prev => [...prev, res.data]);
      setForm({ name: "", siret: "", vatNumber: "" });
      setShowForm(false);
    } else {
      console.error(res.message);
    }
  };

  return (
    <div>
      <h1>Liste des sociétés</h1>
      <button onClick={() => setShowForm(!showForm)}>+</button>

      {showForm && (
        <div>
          <div>
          <input
            placeholder="Nom"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          />
          </div>
          <div>
          <input
            placeholder="SIRET"
            value={form.siret}
            onChange={e => setForm(prev => ({ ...prev, siret: e.target.value }))}
          />
          </div>
          <div>
          <input
            placeholder="N° TVA"
            value={form.vatNumber}
            onChange={e => setForm(prev => ({ ...prev, vatNumber: e.target.value }))}
          />
          </div>
          <div>
          <button onClick={handleCreate}>Créer</button>
          <button onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {companies.map((company) => (
        <div key={company.id}>{company.name}</div>
      ))}
    </div>
  );
}

export default App;