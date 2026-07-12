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
} from 'lucide-react'

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

const mainNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Estoque', url: '/estoque', icon: Package },
  { title: 'Receitas', url: '/receitas', icon: UtensilsCrossed },
  { title: 'Vendas', url: '/vendas', icon: TrendingUp },
  { title: 'Compras', url: '/compras', icon: ShoppingCart },
  { title: 'Fornecedores', url: '/fornecedores', icon: Truck },
  { title: 'Financeiro', url: '/financeiro', icon: LineChart },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6 py-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 font-bold text-xl text-primary w-full"
        >
          <ChefHat className="h-6 w-6 text-primary" />
          <span>Oniceli</span>
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

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          variant="default"
        >
          <PlusCircle className="h-4 w-4" />
          Ação Rápida
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
