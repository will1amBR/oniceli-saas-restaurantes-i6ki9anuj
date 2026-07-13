const steps = [
  {
    role: 'Para Restaurantes',
    items: [
      'Cadastre ingredientes e armazéns',
      'Crie fichas técnicas com custos',
      'Receba sugestões de compra da IA',
      'Acompanhe indicadores em tempo real',
    ],
  },
  {
    role: 'Para Fornecedores',
    items: [
      'Cadastre seu catálogo de produtos',
      'Receba pedidos automáticos',
      'Gerencie prazos de entrega',
      'Conecte-se com múltiplos restaurantes',
    ],
  },
  {
    role: 'Resultado',
    items: [
      'Menos desperdício (-30%)',
      'CMV otimizado e controlado',
      'Margem de lucro aumentada',
      'Decisões baseadas em dados',
    ],
  },
]

export function LandingHowItWorks() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Como funciona</h2>
          <p className="text-muted-foreground mt-3">Simples para começar, poderoso na operação.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.role}
              className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg">{s.role}</h3>
              </div>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
