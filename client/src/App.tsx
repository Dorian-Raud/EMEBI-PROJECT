import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Declarations from './pages/Declarations'
import Declaration from './pages/Declaration'
import Tiers from './pages/Tiers'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Declarations />} />
        <Route path="/declaration/:type" element={<Declaration />} />
        <Route path="/tiers" element={<Tiers />} />
      </Routes>
    </BrowserRouter>
  )
}