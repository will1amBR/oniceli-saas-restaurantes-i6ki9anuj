import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  BookOpen,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  Settings,
  Bot,
  ChefHat,
  UserCheck,
  Wine,
  Building2,
  TrendingUp,
  Sparkles,
  Smartphone,
  ExternalLink,
  Briefcase,
  BellRing,
  Handshake,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { useRole } from '@/contexts/role-context'
import { useAuth } from '@/hooks/use-auth'

const restaurantNav = [
  { title: 'Dashboard Geral', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Cardápio & Itens', url: '/cardapio-gestao', icon: UtensilsCrossed },
  { title: 'Comanda Garçom', url: '/garcom', icon: UserCheck, badge: 'Touch' },
  { title: 'KDS Cozinha', url: '/cozinha', icon: ChefHat, badge: 'Display' },
  { title: 'Bar & Doses', url: '/bar', icon: Wine, badge: 'Doses' },
  { title: 'Estoque & Insumos', url: '/estoque', icon: Package },
  { title: 'Fichas Técnicas', url: '/receitas', icon: BookOpen },
  { title: 'Registro de Vendas', url: '/vendas', icon: TrendingUp },
  { title: 'Fornecedores', url: '/fornecedores', icon: Truck },
  { title: 'Pedidos de Compra', url: '/compras', icon: ShoppingCart },
  { title: 'Financeiro & CMV', url: '/financeiro', icon: DollarSign },
  { title: 'Equipe & Usuários', url: '/usuarios', icon: Users },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

const supplierNav = [
  { title: 'Painel Fornecedor', url: '/supplier/dashboard', icon: LayoutDashboard },
  { title: 'Pedidos Recebidos', url: '/supplier/pedidos', icon: ShoppingCart, badge: 'Ao Vivo' },
  { title: 'Catálogo de Insumos', url: '/estoque', icon: Package },
  { title: 'Restaurantes Clientes', url: '/supplier/clientes', icon: Building2 },
  { title: 'Financeiro & Receitas', url: '/financeiro', icon: DollarSign },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

const bpoNav = [
  { title: 'Painel Parceiro BPO', url: '/bpo/dashboard', icon: Briefcase },
  { title: 'Clientes Vinculados', url: '/bpo/clientes', icon: Building2, badge: '2026' },
  { title: 'Alertas de Recompra', url: '/bpo/recompra', icon: BellRing, badge: 'Multi-Canal' },
  { title: 'Compras Coletivas', url: '/compras', icon: ShoppingCart, badge: 'Lotes' },
  { title: 'Comissões & MRR', url: '/financeiro', icon: DollarSign },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

export function AppSidebar() {
  const location = useLocation()
  const { role } = useRole()
  const { user } = useAuth()

  // Pick nav by role
  let navItems = restaurantNav
  if (role === 'bpo') {
    navItems = bpoNav
  } else if (role === 'supplier') {
    navItems = supplierNav
  } else if (role === 'kitchen') {
    navItems = [
      { title: 'KDS Cozinha', url: '/cozinha', icon: ChefHat, badge: 'Display' },
      { title: 'Estoque de Insumos', url: '/estoque', icon: Package },
      { title: 'Fichas Técnicas', url: '/receitas', icon: BookOpen },
    ]
  } else if (role === 'bar') {
    navItems = [
      { title: 'Bar & Doses', url: '/bar', icon: Wine, badge: 'Doses' },
      { title: 'Estoque de Bebidas', url: '/estoque', icon: Package },
      { title: 'Fichas de Drinks', url: '/receitas', icon: BookOpen },
    ]
  } else if (role === 'waiter') {
    navItems = [
      { title: 'Comanda Garçom', url: '/garcom', icon: UserCheck, badge: 'Ao Vivo' },
      { title: 'Cardápio Digital', url: '/cardapio', icon: Smartphone, badge: 'Público' },
    ]
  }

  const roleBadgeMap: Record<string, { label: string; class: string }> = {
    restaurant: {
      label: 'Restaurante',
      class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
    bpo: {
      label: 'Parceiro BPO',
      class: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    },
    supplier: {
      label: 'Fornecedor',
      class: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    },
    kitchen: {
      label: 'Cozinha',
      class: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    bar: {
      label: 'Bar & Drinks',
      class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    },
    waiter: {
      label: 'Garçom',
      class: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    },
  }

  const currentRoleBadge = roleBadgeMap[role] || roleBadgeMap.restaurant

  return (
    <Sidebar className="border-r border-border/60 bg-card">
      <SidebarHeader className="p-4 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
            <ChefHat className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-black text-lg leading-tight tracking-tight text-foreground flex items-center gap-1">
              Oniceli
              <span className="text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">
              {user?.name || (role === 'supplier' ? 'Distribuidora' : 'Serena Café')}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 space-y-4">
        {/* Public menu quick shortcut */}
        <div className="px-2">
          <Link
            to="/cardapio"
            target="_blank"
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-all text-xs font-bold text-emerald-800 dark:text-emerald-200 group"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              Cardápio Digital Mesa
            </span>
            <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
          </Link>
        </div>

        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Módulos de Gestão</span>
            <Badge className={`text-[10px] font-bold border-none ${currentRoleBadge.class}`}>
              {currentRoleBadge.label}
            </Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent className="pt-1">
            <SidebarMenu className="gap-1">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== '/dashboard' && location.pathname.startsWith(item.url))

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`relative min-h-[42px] px-3 rounded-xl font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3">
                        {/* Active Dot Indicator */}
                        {isActive && (
                          <div className="absolute left-1 w-1.5 h-5 bg-emerald-600 rounded-r-full shadow-sm" />
                        )}
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            isActive ? 'text-emerald-600 scale-110' : 'text-muted-foreground'
                          }`}
                        />
                        <span className="text-sm truncate flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-bold uppercase px-1.5 py-0 h-4 ${
                              isActive
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/60">
          <div className="h-8 w-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">IA Oniceli Co-Pilot</p>
            <p className="text-[10px] text-muted-foreground">Previsão e CMV ativos</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
