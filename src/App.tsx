import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Inventory from './pages/Inventory'
import Recipes from './pages/Recipes'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Financial from './pages/Financial'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/estoque" element={<Inventory />} />
          <Route path="/receitas" element={<Recipes />} />
          <Route path="/vendas" element={<Sales />} />
          <Route path="/compras" element={<Purchases />} />
          <Route path="/financeiro" element={<Financial />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
