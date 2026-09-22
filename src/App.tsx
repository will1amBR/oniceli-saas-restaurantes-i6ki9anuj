import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoleProvider } from '@/contexts/role-context'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/protected-route'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import DigitalMenu from './pages/DigitalMenu'
import Index from './pages/Index'
import Menu from './pages/Menu'
import Inventory from './pages/Inventory'
import Recipes from './pages/Recipes'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Financial from './pages/Financial'
import Suppliers from './pages/Suppliers'
import Settings from './pages/Settings'
import Users from './pages/Users'
import SupplierDashboard from './pages/SupplierDashboard'
import SupplierOrders from './pages/SupplierOrders'
import SupplierClients from './pages/SupplierClients'
import KitchenDashboard from './pages/KitchenDashboard'
import BarDashboard from './pages/BarDashboard'
import WaiterDashboard from './pages/WaiterDashboard'
import BpoDashboard from './pages/BpoDashboard'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}

function AuthRedirect() {
  const { isAuthenticated, loading, user } = useAuth()
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (isAuthenticated) {
    const role = user?.role
    let target = '/dashboard'
    if (role === 'supplier') {
      target = '/supplier/dashboard'
    } else if (role === 'bpo') {
      target = '/bpo/dashboard'
    } else if (role === 'kitchen') {
      target = '/cozinha'
    } else if (role === 'bar') {
      target = '/bar'
    } else if (role === 'waiter') {
      target = '/garcom'
    } else {
      target = '/dashboard'
    }
    return <Navigate to={target} replace />
  }
  return <Landing />
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PWARegister />
          <Routes>
            <Route path="/" element={<AuthRedirect />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cardapio" element={<DigitalMenu />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cardapios"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'kitchen', 'bar', 'waiter', 'bpo']}>
                    <Menu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cardapio-gestao"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'kitchen', 'bar', 'waiter', 'bpo']}>
                    <Menu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/estoque"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'kitchen', 'bar', 'bpo']}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receitas"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'kitchen', 'bar', 'bpo']}>
                    <Recipes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendas"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Sales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compras"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Purchases />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fornecedores"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Suppliers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/financeiro"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Financial />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute requiredRole={['restaurant', 'bpo']}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cozinha"
                element={
                  <ProtectedRoute requiredRole={['kitchen', 'restaurant', 'waiter', 'bpo']}>
                    <KitchenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bar"
                element={
                  <ProtectedRoute requiredRole={['bar', 'restaurant', 'waiter', 'bpo']}>
                    <BarDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/garcom"
                element={
                  <ProtectedRoute requiredRole={['waiter', 'restaurant', 'kitchen', 'bar', 'bpo']}>
                    <WaiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supplier/dashboard"
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supplier/pedidos"
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/supplier/clientes"
                element={
                  <ProtectedRoute requiredRole="supplier">
                    <SupplierClients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bpo/dashboard"
                element={
                  <ProtectedRoute requiredRole="bpo">
                    <BpoDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bpo/clientes"
                element={
                  <ProtectedRoute requiredRole="bpo">
                    <BpoDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bpo/recompra"
                element={
                  <ProtectedRoute requiredRole="bpo">
                    <BpoDashboard />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
