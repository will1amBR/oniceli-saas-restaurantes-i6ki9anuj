import { Package, Calculator, Truck, Brain, Trash2, BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const features = [
  {
    title: 'Gestão de Estoque Real-time',
    desc: 'Controle por local de armazenamento com alertas automáticos de reposição e validade em tempo real.',
    icon: Package,
  },
  {
    title: 'Ficha Técnica Automatizada',
    desc: 'Crie receitas vinculadas ao estoque. O custo do prato é recalculado automaticamente quando o preço de um ingrediente muda.',
    icon: Calculator,
  },
  {
    title: 'Painel do Fornecedor',
    desc: 'Marketplace integrado. Crie pedidos, acompanhe entregas e gerencie relacionamentos com todos os seus fornecedores.',
    icon: Truck,
  },
  {
    title: 'Previsão de Demanda com IA',
    desc: 'Antecipe a demanda e receba sugestões de compra inteligentes baseadas em histórico de vendas e sazonalidade.',
    icon: Brain,
  },
  {
    title: 'Controle de Desperdício',
    desc: 'Registre perdas, acompanhe validades e receba sugestões de promoção para ingredientes próximos ao vencimento.',
    icon: Trash2,
  },
  {
    title: 'Relatórios Financeiros',
    desc: 'CMV por prato, margem de lucro e indicadores operacionais em tempo real para decisões assertivas.',
    icon: BarChart3,
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
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                  <f.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
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
