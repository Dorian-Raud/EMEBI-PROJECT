import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Company } from '../lib/api/requester'

type ClientContextValue = {
  selectedCompany: Company | null
  selectCompany: (company: Company) => void
  clearCompany: () => void
}

const STORAGE_KEY = 'emebi.selectedCompany'

const ClientContext = createContext<ClientContextValue | null>(null)

function readStoredCompany(): Company | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Company
  } catch {
    return null
  }
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(() => readStoredCompany())

  const selectCompany = useCallback((company: Company) => {
    setSelectedCompany(company)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(company))
  }, [])

  const clearCompany = useCallback(() => {
    setSelectedCompany(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({ selectedCompany, selectCompany, clearCompany }),
    [selectedCompany, selectCompany, clearCompany],
  )

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClient() {
  const ctx = useContext(ClientContext)
  if (!ctx) {
    throw new Error('useClient doit être utilisé dans un ClientProvider')
  }
  return ctx
}
