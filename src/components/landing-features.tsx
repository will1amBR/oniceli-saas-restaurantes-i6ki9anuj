import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const features = [
  {
    title: 'Previsões com IA',
    desc: 'Antecipe demanda e sugestões de compra inteligentes baseadas em histórico e sazonalidade.',
  },
  {
    title: 'Cálculo de CMV',
    desc: 'Custos exatos por prato com fichas técnicas vinculadas aos ingredientes em tempo real.',
  },
  {
    title: 'Redução de Desperdício',
    desc: 'Alertas de validade e sugestões de promoção para ingredientes próximos ao vencimento.',
  },
  {
    title: 'Gestão de Estoque',
    desc: 'Controle por local de armazenamento: câmara fria, freezer, geladeira e estoque seco.',
  },
  {
    title: 'Relatórios Financeiros',
    desc: 'DRE gerencial, margem por prato e indicadores operacionais em tempo real.',
  },
  {
    title: 'Multi-Tenant Seguro',
    desc: 'Cada restaurante e fornecedor com dados isolados e gestão de permissões por papel.',
  },
]

export function LandingFeatures() {
  return (
    <section id="funcionalidades" className="py-20 bg-white dark:bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Recursos que transformam sua operação
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Da compra do ingrediente ao prato final, tudo conectado por inteligência artificial.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card
              key={f.title}
              className="hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="text-lg text-emerald-600 dark:text-emerald-400">
                  {f.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
