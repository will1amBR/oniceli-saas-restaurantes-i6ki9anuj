import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, TrendingUp, LineChart, UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { title: 'Início', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Estoque', url: '/estoque', icon: Package },
  { title: 'Receitas', url: '/receitas', icon: UtensilsCrossed },
  { title: 'Vendas', url: '/vendas', icon: TrendingUp },
  { title: 'Financ.', url: '/financeiro', icon: LineChart },
]

export function BottomNav() {
  const location = useLocation()
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
