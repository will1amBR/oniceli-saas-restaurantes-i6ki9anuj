import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'

type Role = 'restaurant' | 'supplier'

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
  toggleRole: () => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [role, setRole] = useState<Role>('restaurant')

  useEffect(() => {
    if (user?.role === 'supplier') {
      setRole('supplier')
    } else if (user?.role === 'restaurant') {
      setRole('restaurant')
    }
  }, [user?.role])

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
