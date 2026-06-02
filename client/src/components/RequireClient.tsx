import { Navigate, Outlet } from 'react-router-dom'
import { useClient } from '../context/ClientContext'

export default function RequireClient() {
  const { selectedCompany } = useClient()
  if (!selectedCompany) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
