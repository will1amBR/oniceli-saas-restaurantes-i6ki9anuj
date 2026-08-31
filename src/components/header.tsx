import {
  Search,
  User,
  Store,
  Truck,
  ChefHat,
  UtensilsCrossed,
  Wine,
  Coffee,
  Briefcase,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRole } from '@/contexts/role-context'
import { useAuth } from '@/hooks/use-auth'
import { NotificationCenter } from '@/components/notification-center'

export function Header() {
  const { role, toggleRole } = useRole()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 md:gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <SidebarTrigger className="-ml-2 shrink-0" />

      <div className="flex-1 flex items-center min-w-0">
        <div className="w-full max-w-sm relative hidden sm:flex">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="search"
            placeholder="Buscar no estoque, receitas..."
            className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleRole}
          className="hidden md:flex gap-2 text-xs"
        >
          {role === 'restaurant' ? (
            <ChefHat className="h-4 w-4" />
          ) : role === 'bpo' ? (
            <Briefcase className="h-4 w-4" />
          ) : role === 'kitchen' ? (
            <UtensilsCrossed className="h-4 w-4" />
          ) : role === 'bar' ? (
            <Wine className="h-4 w-4" />
          ) : role === 'waiter' ? (
            <Coffee className="h-4 w-4" />
          ) : (
            <Truck className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {role === 'restaurant'
              ? 'Restaurante'
              : role === 'bpo'
                ? 'Parceiro BPO'
                : role === 'kitchen'
                  ? 'Cozinha'
                  : role === 'bar'
                    ? 'Bar'
                    : role === 'waiter'
                      ? 'Garçom'
                      : 'Fornecedor'}
          </span>{' '}
        </Button>

        <span className="hidden lg:inline-flex text-sm font-medium text-muted-foreground truncate max-w-[200px]">
          {user?.name || 'Serena Café'}
        </span>

        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted border shrink-0">
              <User className="h-5 w-5" />
              <span className="sr-only">Menu do usuário</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Trocar Restaurante</DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                signOut()
                navigate('/login')
              }}
            >
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
