import { createContext, useContext, useState, type ReactNode } from 'react'

type Role = 'restaurant' | 'supplier'

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
  toggleRole: () => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('restaurant')
  const toggleRole = () => setRole((prev) => (prev === 'restaurant' ? 'supplier' : 'restaurant'))
  return (
    <RoleContext.Provider value={{ role, setRole, toggleRole }}>{children}</RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
