import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { BrandSplash } from '@/components/brand-splash'
import Landing from '@/pages/Landing'

export function HomeRedirect() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <BrandSplash message="Verificando seu perfil..." />
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
