import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Lite',
    priceRange: 'R$ 290 - R$ 450',
    period: '/mês',
    description: 'Dark Kitchens e Pequenos Restaurantes.',
    target: 'Dark Kitchens e Pequenos Restaurantes',
    features: [
      'Gestão de estoque (até 200 itens)',
      '1 restaurante',
      'Alertas de validade',
      'Controle de desperdício',
      '2 usuários',
    ],
    highlighted: false,
    cta: 'Começar com Lite',
    link: '/onboarding?role=restaurant',
  },
  {
    name: 'Pro',
    priceRange: 'R$ 600 - R$ 950',
    period: '/mês',
    description: 'Restaurantes com Faturamento acima de 100 mil.',
    target: 'Restaurantes com Faturamento acima de 100 mil',
    features: [
      'Estoque ilimitado',
      'Fichas técnicas automatizadas',
      'Pedidos a fornecedores',
      'Insights com IA',
      'Relatórios financeiros',
      'Até 10 usuários',
    ],
    highlighted: true,
    cta: 'Testar Pro',
    link: '/onboarding?role=restaurant',
  },
  {
    name: 'Enterprise',
    priceRange: 'R$ 2.000+',
    period: '/mês',
    description: 'Redes, franquias e operações de alta escala.',
    target: 'Redes e Grandes Operações',
    features: [
      'Multi-loja e multi-usuário',
      'Gestão de múltiplas unidades',
      'API de integração',
      'Assistente de IA dedicado',
      'Suporte prioritário 24/7',
      'Usuários ilimitados',
    ],
    highlighted: false,
    cta: 'Falar com Vendas',
    link: '/onboarding?role=restaurant',
  },
]

export function LandingPlans() {
  return (
    <section id="planos" className="py-20 bg-white dark:bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Planos para cada etapa do seu negócio
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Comece grátis e evolua conforme sua operação cresce. Sem fidelidade, cancele quando
            quiser.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                'relative flex flex-col transition-all duration-300',
                plan.highlighted
                  ? 'border-emerald-500 shadow-lg md:scale-105'
                  : 'hover:shadow-md hover:border-emerald-300',
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-600 px-4 py-1 text-xs font-semibold text-white">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  {plan.target}
                </span>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-3xl font-bold tracking-tight">{plan.priceRange}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className={
                    plan.highlighted
                      ? 'w-full bg-emerald-600 hover:bg-emerald-700'
                      : 'w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                  }
                >
                  <Link to={plan.link}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
