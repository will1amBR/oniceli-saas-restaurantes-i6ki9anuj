import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?:
    | 'restaurant'
    | 'supplier'
    | 'kitchen'
    | 'waiter'
    | Array<'restaurant' | 'supplier' | 'kitchen' | 'waiter'>
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
      case 'waiter':
        return '/garcom'
      case 'restaurant':
      default:
        return '/dashboard'
    }
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(role)
      : role === requiredRole
    if (!allowed) {
      return <Navigate to={getHomeRoute(role)} replace />
    }
  }

  return <>{children}</>
}
