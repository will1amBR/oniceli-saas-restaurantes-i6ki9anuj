import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ChefHat, Truck, Check, ArrowRight, ArrowLeft, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const plans = [
  {
    name: 'Starter',
    price: 'R$ 0',
    period: '/mês',
    features: ['Gestão de estoque', '1 usuário', 'Relatórios básicos'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'R$ 149',
    period: '/mês',
    features: ['5 Agentes de IA', 'Controle de validade', 'Análise financeira', 'Multi-usuário'],
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'R$ 399',
    period: '/mês',
    features: ['Multi-loja', 'API completa', 'Suporte prioritário', 'Previsão de demanda'],
    highlight: false,
  },
]

export default function Onboarding() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const role = params.get('role') || 'restaurant'
  const [step, setStep] = useState(1)
  const [hasColdRoom, setHasColdRoom] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [salesVolume, setSalesVolume] = useState('')

  const handleFinish = () => {
    if (isAuthenticated) navigate('/dashboard')
    else navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ChefHat className="h-6 w-6" /> Oniceli
          </Link>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-2 w-10 rounded-full transition-colors',
                  s <= step ? 'bg-emerald-600' : 'bg-muted',
                )}
              />
            ))}
          </div>
        </div>

        {step === 1 && (
          <Card className="animate-fade-in-up">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Confirme seu perfil</h2>
                <p className="text-muted-foreground mt-1">Você está se cadastrando como:</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { r: 'restaurant', icon: Store, label: 'Restaurante' },
                  { r: 'supplier', icon: Truck, label: 'Fornecedor' },
                ].map((opt) => (
                  <button
                    key={opt.r}
                    onClick={() => navigate(`/onboarding?role=${opt.r}`)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all',
                      role === opt.r
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                        : 'border-border hover:border-emerald-400',
                    )}
                  >
                    <opt.icon
                      className={cn(
                        'h-8 w-8',
                        role === opt.r ? 'text-emerald-600' : 'text-muted-foreground',
                      )}
                    />
                    <span className="font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="animate-fade-in-up">
            <CardContent className="pt-6 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Conte sobre seu negócio</h2>
                <p className="text-muted-foreground mt-1">Responda algumas perguntas rápidas</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Possui câmara fria?</Label>
                  <div className="flex gap-2">
                    {['Sim', 'Não'].map((v) => (
                      <Button
                        key={v}
                        variant={hasColdRoom === v ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setHasColdRoom(v)}
                        className={hasColdRoom === v ? 'bg-emerald-600' : ''}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ing">Principais ingredientes utilizados</Label>
                  <Input
                    id="ing"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="Ex: Salmão, Arroz, Tomate..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volume médio de vendas mensais</Label>
                  <Select value={salesVolume} onValueChange={setSalesVolume}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-500">Até R$ 50.000</SelectItem>
                      <SelectItem value="500-1000">R$ 50.001 - R$ 100.000</SelectItem>
                      <SelectItem value="1000+">Acima de R$ 100.000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Escolha seu plano</h2>
              <p className="text-muted-foreground mt-1">
                Comece grátis, faça upgrade quando precisar
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    'relative flex flex-col',
                    plan.highlight && 'border-emerald-600 border-2 shadow-lg',
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs px-3 py-0.5 rounded-full">
                      Mais popular
                    </span>
                  )}
                  <CardContent className="pt-6 flex flex-col flex-1">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-2xl font-bold mt-1">
                      {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        {plan.period}
                      </span>
                    </p>
                    <ul className="space-y-2 mt-4 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={handleFinish}
                      className={cn(
                        'w-full mt-4',
                        plan.highlight ? 'bg-emerald-600 hover:bg-emerald-700' : '',
                      )}
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      Começar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(2)} className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
