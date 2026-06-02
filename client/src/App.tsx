import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { ClientProvider } from './context/ClientContext'
import RequireClient from './components/RequireClient'
import AppLayout from './components/AppLayout'
import SelectClient from './pages/SelectClient'
import ClientHome from './pages/ClientHome'
import Declarations from './pages/Declarations'
import Declaration from './pages/Declaration'
import Etats from './pages/Etats'
import Tiers from './pages/Tiers'

function RedirectDeclaration() {
  const { type } = useParams()
  return <Navigate to={`/client/declaration/${type ?? 'introduction'}`} replace />
}

export default function App() {
  return (
    <ClientProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SelectClient />} />
          <Route element={<RequireClient />}>
            <Route element={<AppLayout />}>
              <Route path="/client" element={<ClientHome />} />
              <Route path="/client/declarations" element={<Declarations />} />
              <Route path="/client/declaration/:type" element={<Declaration />} />
              <Route path="/client/etats" element={<Etats />} />
              <Route path="/client/tiers" element={<Tiers />} />
            </Route>
          </Route>
          <Route path="/declarations" element={<Navigate to="/client/declarations" replace />} />
          <Route path="/declaration/:type" element={<RedirectDeclaration />} />
          <Route path="/tiers" element={<Navigate to="/client/tiers" replace />} />
        </Routes>
      </BrowserRouter>
    </ClientProvider>
  )
}
