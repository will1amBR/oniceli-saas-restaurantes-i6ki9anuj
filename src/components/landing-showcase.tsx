import { Brain, Recycle, DollarSign } from 'lucide-react'

const sections = [
  {
    icon: Brain,
    badge: 'Inteligência de Estoque',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    title: 'Previsões que evitam rupturas',
    desc: 'Nossa IA analisa consumo histórico, lead time de fornecedores e margens de segurança para prever quando cada item precisará reposição antes que falte.',
    img: 'https://img.usecurling.com/p/600/400?q=restaurant%20kitchen%20fresh%20ingredients',
    alt: 'Cozinha de restaurante com ingredientes frescos',
    reverse: false,
  },
  {
    icon: Recycle,
    badge: 'Anti-Desperdício',
    badgeClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    title: 'Cada ingrediente conta',
    desc: 'Alertas de validade em tempo real, sugestões de promoção para itens próximos ao vencimento e cálculo automático do impacto financeiro de cada perda.',
    img: 'https://img.usecurling.com/p/600/400?q=fresh%20food%20market',
    alt: 'Mercado de alimentos frescos',
    reverse: true,
  },
  {
    icon: DollarSign,
    badge: 'Análise Financeira',
    badgeClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    title: 'CMV e margem sob controle',
    desc: 'Cálculo automático de custo por prato, margem de contribuição e lucratividade. Relatórios em tempo real para decisões rápidas e precisas.',
    img: 'https://img.usecurling.com/p/600/400?q=restaurant%20business%20analytics',
    alt: 'Análise de negócios para restaurante',
    reverse: false,
  },
]

export function LandingShowcase() {
  return (
    <section className="py-20 bg-white dark:bg-background">
      <div className="container mx-auto px-4 max-w-6xl space-y-20">
        {sections.map((s) => (
          <div key={s.title} className="grid md:grid-cols-2 gap-8 items-center">
            <div className={s.reverse ? 'order-2 md:order-1' : ''}>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${s.badgeClass}`}
              >
                <s.icon className="h-4 w-4" /> {s.badge}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
            <div
              className={`rounded-2xl overflow-hidden shadow-xl ${s.reverse ? 'order-1 md:order-2' : ''}`}
            >
              <img src={s.img} alt={s.alt} className="w-full h-full object-cover" loading="lazy" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
