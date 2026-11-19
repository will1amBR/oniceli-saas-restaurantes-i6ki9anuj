import { ChefHat, Loader2 } from 'lucide-react'

/**
 * Splash de carregamento com a marca Oniceli — usado na raiz "/" (e em
 * redirecionamentos de perfil) para que nunca apareça uma tela em branco
 * ou piscada enquanto o perfil resolve.
 */
export function BrandSplash({ message = 'Carregando sua experiência...' }: { message?: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-900/10 via-background to-teal-900/10 p-4">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-3xl bg-emerald-600/10 animate-pulse" />
        <div className="relative h-16 w-16 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 ring-4 ring-emerald-500/10">
          <ChefHat className="h-9 w-9" />
        </div>
        <Loader2 className="absolute -bottom-2 -right-2 h-7 w-7 animate-spin text-emerald-600 bg-background rounded-full" />
      </div>
      <p className="mt-6 text-lg font-black tracking-tight text-foreground">Oniceli</p>
      <p className="mt-1 text-xs font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  )
}
