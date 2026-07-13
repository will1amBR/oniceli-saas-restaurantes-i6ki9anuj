import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'

const NAV_LINKS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Planos', href: '#planos' },
]

export function LandingHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 max-w-6xl">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            Oniceli
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button asChild variant="ghost" className="min-h-[44px]">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]">
            <Link to="/onboarding?role=restaurant">Começar agora</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden min-h-[44px] min-w-[44px]">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs p-0">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                  <span className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                    Oniceli
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-4 py-3 text-base font-medium text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors min-h-[44px] flex items-center"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto p-4 border-t space-y-3">
                <Button
                  asChild
                  variant="outline"
                  className="w-full min-h-[44px]"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/login">Entrar</Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/onboarding?role=restaurant">Começar agora</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
