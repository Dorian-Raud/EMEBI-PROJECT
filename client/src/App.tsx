import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ClientProvider } from './context/ClientContext'
import RequireClient from './components/RequireClient'
import AppLayout from './components/AppLayout'
import Home from './pages/Home'
import SelectClient from './pages/SelectClient'
import Declarations from './pages/Declarations'
import Declaration from './pages/Declaration'
import Etats from './pages/Etats'
import Tiers from './pages/Tiers'
import DeclarationsList from './pages/DeclarationsList'

function RedirectDeclaration() {
  const { type } = useParams()
  return <Navigate to={`/saisie/declaration/${type ?? 'introduction'}`} replace />
}

export default function App() {
  return (
    <ClientProvider>
      <BrowserRouter>
        <Routes>
          {/* Home — 4 big tiles */}
          <Route path="/" element={<Home />} />

          <Route element={<AppLayout />}>
            {/* Saisie flow: pick client then work */}
            <Route path="/saisie" element={<SelectClient />} />

            {/* États flow: pick client (no create) then view */}
            <Route path="/etats" element={<SelectClient nextPath="/etats/view" showCreate={false} />} />

            {/* Déclarations clients flow: pick client (no create) then view */}
            <Route path="/declarations-clients" element={<SelectClient nextPath="/declarations-clients/view" showCreate={false} />} />

            <Route element={<RequireClient />}>
              <Route path="/saisie/declarations" element={<Declarations />} />
              <Route path="/saisie/declaration/:type" element={<Declaration />} />
              <Route path="/etats/view" element={<Etats />} />
              <Route path="/declarations-clients/view" element={<DeclarationsList />} />
              <Route path="/gestion/tiers" element={<Tiers />} />
            </Route>
          </Route>

          {/* Legacy redirects */}
          <Route path="/client" element={<Navigate to="/" replace />} />
          <Route path="/client/declarations" element={<Navigate to="/saisie" replace />} />
          <Route path="/client/declaration/:type" element={<RedirectDeclaration />} />
          <Route path="/client/etats" element={<Navigate to="/etats" replace />} />
          <Route path="/client/tiers" element={<Navigate to="/gestion/tiers" replace />} />
        </Routes>
      </BrowserRouter>
    </ClientProvider>
  )
}
