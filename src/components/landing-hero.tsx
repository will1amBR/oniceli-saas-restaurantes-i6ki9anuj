import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sparkles, Store, Truck } from 'lucide-react'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white dark:from-emerald-950/20 dark:via-background dark:to-background">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -ml-20 -mb-20" />
      <div className="container relative mx-auto px-4 py-20 md:py-32 max-w-6xl">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Gerencie seu negócio com
            <span className="block text-emerald-600 dark:text-emerald-400">
              precisão e inteligência
            </span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Otimize estoque, reduza desperdícios e maximize lucros com previsões de IA, controle de
            validade e gestão financeira integrada.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-h-[48px]"
            >
              <Link to="/onboarding?role=restaurant">
                <Store className="h-5 w-5" /> Sou um Restaurante
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 min-h-[48px]">
              <Link to="/onboarding?role=supplier">
                <Truck className="h-5 w-5" /> Sou um Fornecedor
              </Link>
            </Button>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Já tem conta? Entrar
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Gestão Multi-Loja
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-500" /> Marketplace de Fornecedores
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Controle de Validade
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
