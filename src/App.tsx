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
    const target = user?.role === 'supplier' ? '/supplier/dashboard' : '/dashboard'
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
            <Route path="/onboarding" element={<Onboarding />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Index />} />
              <Route path="/cardapios" element={<Menu />} />
              <Route path="/estoque" element={<Inventory />} />
              <Route path="/receitas" element={<Recipes />} />
              <Route path="/vendas" element={<Sales />} />
              <Route path="/compras" element={<Purchases />} />
              <Route path="/fornecedores" element={<Suppliers />} />
              <Route path="/financeiro" element={<Financial />} />
              <Route path="/usuarios" element={<Users />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
              <Route path="/supplier/pedidos" element={<SupplierOrders />} />
              <Route path="/supplier/clientes" element={<SupplierClients />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </RoleProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
