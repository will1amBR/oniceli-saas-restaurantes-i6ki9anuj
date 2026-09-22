import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export type UserRole = 'restaurant' | 'supplier' | 'kitchen' | 'bar' | 'waiter' | 'bpo'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole | UserRole[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const role = user?.role
  const getHomeRoute = (r?: string) => {
    switch (r) {
      case 'supplier':
        return '/supplier/dashboard'
      case 'kitchen':
        return '/cozinha'
      case 'bar':
        return '/bar'
      case 'waiter':
        return '/garcom'
      case 'bpo':
        return '/bpo/dashboard'
      case 'restaurant':
      default:
        return '/dashboard'
    }
  }

  if (requiredRole) {
    const userRole = role as UserRole
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(userRole)
      : userRole === requiredRole
    if (!allowed) {
      return <Navigate to={getHomeRoute(role)} replace />
    }
  }

  return <>{children}</>
}
