import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from '@/hooks/use-auth'

export type Role = 'restaurant' | 'supplier' | 'kitchen' | 'waiter' | 'bar' | 'bpo'

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
    if (user?.role) {
      setRole(user.role as Role)
    }
  }, [user?.role])

  const toggleRole = () =>
    setRole((prev) => {
      if (prev === 'restaurant') return 'supplier'
      if (prev === 'supplier') return 'bpo'
      if (prev === 'bpo') return 'kitchen'
      if (prev === 'kitchen') return 'bar'
      if (prev === 'bar') return 'waiter'
      return 'restaurant'
    })

  return (
    <RoleContext.Provider value={{ role, setRole, toggleRole }}>{children}</RoleContext.Provider>
  )
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
