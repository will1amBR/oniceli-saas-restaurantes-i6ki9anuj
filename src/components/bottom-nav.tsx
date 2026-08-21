import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  LineChart,
  BookOpen,
  ChefHat,
  ClipboardList,
  Wine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

export function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const role = user?.role

  let navItems = [
    { title: 'Início', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Comandas', url: '/garcom', icon: ClipboardList },
    { title: 'Cozinha', url: '/cozinha', icon: ChefHat },
    { title: 'Estoque', url: '/estoque', icon: Package },
    { title: 'Financ.', url: '/financeiro', icon: LineChart },
  ]

  if (role === 'supplier') {
    navItems = [
      { title: 'Dashboard', url: '/supplier/dashboard', icon: LayoutDashboard },
      { title: 'Pedidos', url: '/supplier/pedidos', icon: ClipboardList },
      { title: 'Clientes', url: '/supplier/clientes', icon: BookOpen },
    ]
  } else if (role === 'waiter') {
    navItems = [
      { title: 'Comandas', url: '/garcom', icon: ClipboardList },
      { title: 'Cardápio', url: '/cardapios', icon: BookOpen },
      { title: 'Cozinha', url: '/cozinha', icon: ChefHat },
    ]
  } else if (role === 'kitchen') {
    navItems = [
      { title: 'Cozinha', url: '/cozinha', icon: ChefHat },
      { title: 'Cardápio', url: '/cardapios', icon: BookOpen },
      { title: 'Estoque', url: '/estoque', icon: Package },
    ]
  } else if (role === 'bar') {
    navItems = [
      { title: 'Bar', url: '/bar', icon: Wine },
      { title: 'Cardápio', url: '/cardapios', icon: BookOpen },
      { title: 'Estoque', url: '/estoque', icon: Package },
    ]
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background py-2 md:hidden safe-area-pb">
      {navItems.map((item) => {
        const isActive = location.pathname === item.url
        return (
          <Link key={item.title} to={item.url} className="flex flex-col items-center gap-1 px-2">
            <item.icon
              className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')}
            />
            <span
              className={cn(
                'text-[10px]',
                isActive ? 'text-primary font-medium' : 'text-muted-foreground',
              )}
            >
              {item.title}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
