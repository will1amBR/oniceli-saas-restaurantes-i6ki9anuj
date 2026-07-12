import { Star, TrendingDown, Clock, Users } from 'lucide-react'

const stats = [
  { icon: Users, value: '300+', label: 'Restaurantes' },
  { icon: TrendingDown, value: '40%', label: 'Menos Desperdício' },
  { icon: Clock, value: '2h', label: 'Economizadas/dia' },
  { icon: Star, value: '4.8', label: 'Avaliação Média' },
]

const testimonials = [
  {
    name: 'Carla Mendes',
    role: 'Chef-Dona, Trattoria Bella',
    img: 'https://img.usecurling.com/ppl/medium?gender=female&seed=1',
    quote:
      'Reduzi o desperdício em 35% no primeiro mês. As previsões de compra da IA são incrivelmente precisas.',
  },
  {
    name: 'Roberto Silva',
    role: 'Gerente, Sushi House',
    img: 'https://img.usecurling.com/ppl/medium?gender=male&seed=2',
    quote:
      'O controle de validade salvou meu estoque. Recebo alertas com antecedência e nunca mais perdi peixe por vencimento.',
  },
  {
    name: 'Ana Paula Costa',
    role: 'Proprietária, Bistrô Gourmet',
    img: 'https://img.usecurling.com/ppl/medium?gender=female&seed=3',
    quote:
      'Finalmente tenho visão do CMV por prato em tempo real. Aumentei a margem em 12% apenas ajustando o cardápio.',
  },
]

export function LandingSocialProof() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Resultados que falam por si
          </h2>
          <p className="text-muted-foreground mt-3">Restaurantes reais, impactos reais.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="inline-flex w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mb-3">
                <s.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
