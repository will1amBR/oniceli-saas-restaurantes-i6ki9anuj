import { Brain, DollarSign, Recycle, Package, BarChart3, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'Previsões com IA',
    desc: 'Antecipe demanda e sugestões de compra inteligentes baseadas em histórico e sazonalidade.',
  },
  {
    icon: DollarSign,
    title: 'Cálculo de CMV',
    desc: 'Custos exatos por prato com fichas técnicas vinculadas aos ingredientes em tempo real.',
  },
  {
    icon: Recycle,
    title: 'Redução de Desperdício',
    desc: 'Alertas de validade e sugestões de promoção para ingredientes próximos ao vencimento.',
  },
  {
    icon: Package,
    title: 'Gestão de Estoque',
    desc: 'Controle por local de armazenamento: câmara fria, freezer, geladeira e estoque seco.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Financeiros',
    desc: 'DRE gerencial, margem por prato e indicadores operacionais em tempo real.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-Tenant Seguro',
    desc: 'Cada restaurante e fornecedor com dados isolados e gestão de permissões por papel.',
  },
]

export function LandingFeatures() {
  return (
    <section className="py-20 bg-white dark:bg-background">
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
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                  <f.icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{f.desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
