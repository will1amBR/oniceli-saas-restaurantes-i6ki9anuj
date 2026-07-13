import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Básico',
    price: 'R$ 99',
    period: '/mês',
    description: 'Ideal para restaurantes pequenos começando a organizar suas operações.',
    features: [
      'Controle de estoque (até 50 itens)',
      'Fichas técnicas ilimitadas',
      'Cálculo automático de CMV',
      'Alertas de validade',
      '1 usuário',
    ],
    highlighted: false,
    cta: 'Começar Grátis',
    link: '/onboarding?role=restaurant',
  },
  {
    name: 'Pro',
    price: 'R$ 249',
    period: '/mês',
    description: 'Para restaurantes que querem otimizar custos com IA e reduzir desperdícios.',
    features: [
      'Estoque ilimitado',
      'Previsões de demanda com IA',
      'Gestão de fornecedores',
      'Relatórios financeiros avançados',
      'Sugestões de promoção automáticas',
      'Até 5 usuários',
    ],
    highlighted: true,
    cta: 'Testar Pro',
    link: '/onboarding?role=restaurant',
  },
  {
    name: 'Enterprise',
    price: 'R$ 599',
    period: '/mês',
    description: 'Para redes e grandes operações com múltiplas lojas e fornecedores.',
    features: [
      'Multi-loja e multi-usuário',
      'API de integração',
      'Marketplace de fornecedores',
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
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
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
