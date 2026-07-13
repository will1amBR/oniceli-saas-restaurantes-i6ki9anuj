import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function LandingCTA() {
  return (
    <>
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-cyan-600">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
            Pronto para revolucionar seu restaurante?
          </h2>
          <p className="text-emerald-50 mt-4 text-base md:text-lg max-w-2xl mx-auto">
            Junte-se a centenas de restaurantes que já reduziram desperdícios e aumentaram a margem
            de lucro com o Oniceli.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <Button asChild size="lg" variant="secondary" className="min-h-[48px]">
              <Link to="/onboarding?role=restaurant">Criar Conta Grátis</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10 min-h-[48px]"
            >
              <Link to="/login">Entrar</Link>
            </Button>
          </div>
        </div>
      </section>
      <footer className="py-8 bg-slate-900 dark:bg-background border-t">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-bold text-white dark:text-slate-100">Oniceli</span>
          <p className="text-sm text-slate-400">
            © 2025 Oniceli SaaS · Gestão Inteligente de Restaurantes
          </p>
        </div>
      </footer>
    </>
  )
}
