import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoleProvider } from '@/contexts/role-context'
import Landing from './pages/Landing'
import Index from './pages/Index'
import Inventory from './pages/Inventory'
import Recipes from './pages/Recipes'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Financial from './pages/Financial'
import Suppliers from './pages/Suppliers'
import Settings from './pages/Settings'
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

const App = () => (
  <BrowserRouter>
    <RoleProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWARegister />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Index />} />
            <Route path="/estoque" element={<Inventory />} />
            <Route path="/receitas" element={<Recipes />} />
            <Route path="/vendas" element={<Sales />} />
            <Route path="/compras" element={<Purchases />} />
            <Route path="/fornecedores" element={<Suppliers />} />
            <Route path="/financeiro" element={<Financial />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </RoleProvider>
  </BrowserRouter>
)

export default App
