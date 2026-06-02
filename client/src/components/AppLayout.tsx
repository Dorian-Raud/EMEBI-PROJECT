import { Link, NavLink, Outlet } from 'react-router-dom'
import { useClient } from '../context/ClientContext'
import './AppLayout.css'

export default function AppLayout() {
  const { selectedCompany, clearCompany } = useClient()

  return (
    <div className="AppLayout">
      <header className="AppLayoutHeader">
        <div className="AppLayoutBrand">
          <Link to="/client" className="AppLayoutHomeLink">
            EMEBI
          </Link>
          {selectedCompany ? (
            <span className="AppLayoutClient">
              {selectedCompany.name}
            </span>
          ) : null}
        </div>

        <nav className="AppLayoutNav" aria-label="Navigation client">
          <NavLink to="/client" end className="AppLayoutNavLink">
            Accueil
          </NavLink>
          <NavLink to="/client/declarations" className="AppLayoutNavLink">
            Déclarations
          </NavLink>
          <NavLink to="/client/etats" className="AppLayoutNavLink">
            États
          </NavLink>
          <NavLink to="/client/tiers" className="AppLayoutNavLink">
            Tiers
          </NavLink>
        </nav>

        <div className="AppLayoutActions">
          <Link to="/" className="AppLayoutActionLink" onClick={() => clearCompany()}>
            Changer de client
          </Link>
        </div>
      </header>

      <main className="AppLayoutMain">
        <Outlet />
      </main>
    </div>
  )
}
