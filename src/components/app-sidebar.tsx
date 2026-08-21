import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  TrendingUp,
  ShoppingCart,
  LineChart,
  Settings,
  PlusCircle,
  ChefHat,
  Truck,
  ClipboardList,
  BookOpen,
  Users,
  UserCog,
  Wine,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

const restaurantNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Cardápio & Receitas', url: '/cardapios', icon: BookOpen },
  { title: 'Estoque & Doses', url: '/estoque', icon: Package },
  { title: 'Fichas Técnicas', url: '/receitas', icon: UtensilsCrossed },
  { title: 'Comandas (Garçom)', url: '/garcom', icon: ClipboardList },
  { title: 'Cozinha (KDS)', url: '/cozinha', icon: ChefHat },
  { title: 'Bar & Doses', url: '/bar', icon: Wine },
  { title: 'Vendas', url: '/vendas', icon: TrendingUp },
  { title: 'Compras', url: '/compras', icon: ShoppingCart },
  { title: 'Fornecedores', url: '/fornecedores', icon: Truck },
  { title: 'Financeiro', url: '/financeiro', icon: LineChart },
]

const kitchenNav = [
  { title: 'Cozinha (KDS)', url: '/cozinha', icon: ChefHat },
  { title: 'Cardápio', url: '/cardapios', icon: BookOpen },
  { title: 'Estoque', url: '/estoque', icon: Package },
]

const barNav = [
  { title: 'Bar (KDS & Doses)', url: '/bar', icon: Wine },
  { title: 'Cardápio de Drinks', url: '/cardapios', icon: BookOpen },
  { title: 'Estoque de Bebidas', url: '/estoque', icon: Package },
]

const waiterNav = [
  { title: 'Comandas (Cozinha & Bar)', url: '/garcom', icon: ClipboardList },
  { title: 'Cardápio', url: '/cardapios', icon: BookOpen },
  { title: 'Status Cozinha', url: '/cozinha', icon: ChefHat },
  { title: 'Status Bar', url: '/bar', icon: Wine },
]

const supplierNav = [
  { title: 'Dashboard', url: '/supplier/dashboard', icon: LayoutDashboard },
  { title: 'Pedidos', url: '/supplier/pedidos', icon: ClipboardList },
  { title: 'Meus Clientes', url: '/supplier/clientes', icon: Users },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.role

  let mainNav = restaurantNav
  if (role === 'supplier') mainNav = supplierNav
  else if (role === 'kitchen') mainNav = kitchenNav
  else if (role === 'bar') mainNav = barNav
  else if (role === 'waiter') mainNav = waiterNav

  const isSupplier = role === 'supplier'
  const isStaff = role === 'kitchen' || role === 'bar' || role === 'waiter'

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6 py-4">
        <Link
          to={
            role === 'supplier'
              ? '/supplier/dashboard'
              : role === 'kitchen'
                ? '/cozinha'
                : role === 'bar'
                  ? '/bar'
                  : role === 'waiter'
                    ? '/garcom'
                    : '/dashboard'
          }
          className="flex items-center gap-2 font-bold text-xl text-primary w-full truncate"
        >
          <ChefHat className="h-6 w-6 text-primary shrink-0" />
          <span className="truncate">{user?.name || 'Serena Café'}</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isSupplier && !isStaff && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/usuarios'}>
                    <Link to="/usuarios">
                      <UserCog />
                      <span>Usuários</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === '/configuracoes'}>
                    <Link to="/configuracoes">
                      <Settings />
                      <span>Configurações</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          asChild
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          variant="default"
        >
          <Link
            to={
              isSupplier
                ? '/supplier/pedidos'
                : role === 'waiter'
                  ? '/garcom'
                  : role === 'kitchen'
                    ? '/cozinha'
                    : role === 'bar'
                      ? '/bar'
                      : '/receitas'
            }
          >
            <PlusCircle className="h-4 w-4" />
            {isSupplier
              ? 'Ver Pedidos'
              : role === 'waiter'
                ? 'Nova Comanda'
                : role === 'kitchen'
                  ? 'Fila da Cozinha'
                  : role === 'bar'
                    ? 'Fila do Bar'
                    : 'Nova Receita'}
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
