import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import Landing from '@/pages/Landing'

export function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    const role = (pb.authStore.record as any)?.role
    let target = '/dashboard'
    if (role === 'supplier') target = '/supplier/dashboard'
    else if (role === 'bpo') target = '/bpo/dashboard'
    else if (role === 'kitchen') target = '/cozinha'
    else if (role === 'bar') target = '/bar'
    else if (role === 'waiter') target = '/garcom'
    return <Navigate to={target} replace />
  }

  return <Landing />
}
