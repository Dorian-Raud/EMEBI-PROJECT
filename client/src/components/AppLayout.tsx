import { Link, Outlet, useNavigate } from 'react-router-dom'
import './AppLayout.css'

export default function AppLayout() {
  const navigate = useNavigate()

  return (
    <div className="AppLayout">
      <header className="AppLayoutHeader">
        <div className="AppLayoutBrand">
          <Link to="/" className="AppLayoutHomeLink" title="Retour à l'accueil">
            EMEBI
          </Link>

        </div>

        <div className="AppLayoutActions">
          <button type="button" onClick={() => navigate(-1)} className="AppLayoutBackBtn">
            ← Retour
          </button>
          <Link to="/" className="AppLayoutHomeBtn">
            Accueil
          </Link>
        </div>
      </header>

      <main className="AppLayoutMain">
        <Outlet />
      </main>
    </div>
  )
}
