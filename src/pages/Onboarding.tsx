import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ChefHat,
  Truck,
  Check,
  ArrowRight,
  ArrowLeft,
  Store,
  Upload,
  Image as ImageIcon,
  Users,
  Layers,
  Sparkles,
  CheckCircle2,
  UtensilsCrossed,
  Wine,
  Coffee,
  Plus,
  Trash2,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { saveOnboardingData, persistOnboardingData } from '@/services/onboarding'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

const defaultRestaurantCategories = [
  'Pratos Principais',
  'Entradas',
  'Cafés & Bebidas',
  'Sucos & Smoothies',
  'Toasts & Lanches',
  'Bowls & Saladas',
  'Sobremesas',
  'Coquetéis & Drinks',
]

const supplierCategories = [
  'Hortifruti',
  'Carnes & Aves',
  'Peixes & Frutos do Mar',
  'Laticínios & Queijos',
  'Bebidas & Destilados',
  'Grãos & Farinhas',
  'Embalagens & Descartáveis',
  'Padaria & Confeitaria',
]

const plans = [
  {
    name: 'Plano Lite',
    price: 'R$ 290 - R$ 450',
    period: '/mês',
    description: 'Dark Kitchens e Pequenos Restaurantes.',
    features: [
      'Gestão de estoque (até 200 itens)',
      '1 restaurante',
      'Alertas de validade',
      'Controle de desperdício',
      '2 usuários',
      'KDS Cozinha',
    ],
    highlight: false,
  },
  {
    name: 'Plano Pro',
    price: 'R$ 600 - R$ 950',
    period: '/mês',
    description: 'Restaurantes com Faturamento acima de 100 mil.',
    features: [
      'Estoque ilimitado',
      'Fichas técnicas automatizadas',
      'KDS Cozinha & Bar (Doses em ML)',
      'Controle de Validade & CMV',
      'Curva ABC & Inteligência Artificial',
      'Até 10 usuários',
    ],
    highlight: true,
  },
  {
    name: 'Plano Enterprise',
    price: 'R$ 2.000+',
    period: '/mês',
    description: 'Redes, franquias e operações de alta escala.',
    features: [
      'Multi-lojas centralizadas',
      'Gestão de múltiplas unidades',
      'API e integrações completas',
      'Assistente de IA dedicado',
      'Suporte prioritário 24/7',
      'Usuários ilimitados',
    ],
    highlight: false,
  },
]

export default function Onboarding() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const initialRole = (params.get('role') as 'restaurant' | 'supplier') || 'restaurant'

  const [role, setRole] = useState<'restaurant' | 'supplier'>(initialRole)
  const [step, setStep] = useState(1)
  const [loadingFinish, setLoadingFinish] = useState(false)

  // Form State
  const [restaurantName, setRestaurantName] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Pratos Principais',
    'Entradas',
    'Cafés & Bebidas',
    'Sobremesas',
  ])
  const [newCatInput, setNewCatInput] = useState('')

  // Team Invite State
  const [teamEmails, setTeamEmails] = useState<{ email: string; role: string }[]>([
    { email: '', role: 'waiter' },
  ])

  // Supplier fields
  const [deliveryLeadTime, setDeliveryLeadTime] = useState('2')
  const [deliveryRegions, setDeliveryRegions] = useState('')

  const isRestaurant = role === 'restaurant'

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat))
    } else {
      setSelectedCategories([...selectedCategories, cat])
    }
  }

  const addCustomCategory = () => {
    if (newCatInput.trim() && !selectedCategories.includes(newCatInput.trim())) {
      setSelectedCategories([...selectedCategories, newCatInput.trim()])
      setNewCatInput('')
    }
  }

  const handleAddTeamMember = () => {
    setTeamEmails([...teamEmails, { email: '', role: 'waiter' }])
  }

  const handleUpdateTeamMember = (index: number, field: 'email' | 'role', val: string) => {
    const updated = [...teamEmails]
    updated[index][field] = val
    setTeamEmails(updated)
  }

  const handleRemoveTeamMember = (index: number) => {
    setTeamEmails(teamEmails.filter((_, i) => i !== index))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFinish = async (planName: string) => {
    setLoadingFinish(true)
    const questionnaireData: Record<string, string> = {
      name: restaurantName || (isRestaurant ? 'Meu Restaurante' : 'Meu Fornecedor'),
      categories: selectedCategories.join(','),
      deliveryLeadTime,
      deliveryRegions,
      teamMembers: JSON.stringify(teamEmails.filter((t) => t.email.trim())),
    }

    saveOnboardingData({
      role,
      questionnaire: questionnaireData,
      plan: planName,
    })

    if (isAuthenticated && user?.id) {
      try {
        await persistOnboardingData(user.id)
        toast({
          title: 'Configuração concluída!',
          description: `Bem-vindo ao Oniceli, ${restaurantName || 'Restaurante'}!`,
          className: 'bg-emerald-600 text-white font-bold',
        })
      } catch {
        /* ignore */
      }
      navigate(isRestaurant ? '/dashboard' : '/supplier/dashboard')
    } else {
      navigate('/login')
    }
    setLoadingFinish(false)
  }

  const totalSteps = 4

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900/10 via-background to-teal-900/10 py-8 px-4 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with Step Progress Bar */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black text-xl text-emerald-600">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <span>Oniceli</span>
          </Link>

          {/* Stepper pills */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  'h-2.5 rounded-full transition-all',
                  s === step
                    ? 'w-8 bg-emerald-600'
                    : s < step
                      ? 'w-4 bg-emerald-500/80'
                      : 'w-4 bg-muted',
                )}
              />
            ))}
          </div>
        </div>

        {/* Step Indicator Header */}
        <div className="text-center space-y-1">
          <Badge
            variant="outline"
            className="text-emerald-700 bg-emerald-50 border-emerald-300 font-bold"
          >
            Passo {step} de {totalSteps}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {step === 1 && 'Escolha seu perfil de negócio'}
            {step === 2 && (isRestaurant ? 'Identidade do Restaurante' : 'Identidade da Empresa')}
            {step === 3 && (isRestaurant ? 'Categorias do Cardápio' : 'Categorias de Fornecimento')}
            {step === 4 && 'Escolha o plano ideal'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 && 'Personalizaremos sua experiência de acordo com seu modelo'}
            {step === 2 && 'Defina o nome e o logotipo para o cardápio e os relatórios'}
            {step === 3 && 'Organize os itens que seu restaurante serve aos clientes'}
            {step === 4 && 'Tudo pronto para alavancar sua operação com inteligência'}
          </p>
        </div>

        {/* STEP 1: Profile Type */}
        {step === 1 && (
          <Card className="shadow-lg border-border/60 rounded-2xl animate-fade-in-up">
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('restaurant')}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center',
                    role === 'restaurant'
                      ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-md ring-2 ring-emerald-600/20'
                      : 'border-border hover:border-emerald-400 bg-card',
                  )}
                >
                  <div
                    className={cn(
                      'p-4 rounded-2xl',
                      role === 'restaurant'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Store className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Restaurante / Bar / Café</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cardápio digital, comanda de garçom, KDS cozinha & bar e controle de estoque
                    </p>
                  </div>
                  {role === 'restaurant' && (
                    <Badge className="bg-emerald-600 text-white text-[10px] font-bold mt-2">
                      <Check className="h-3 w-3 mr-1" /> Selecionado
                    </Badge>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setRole('supplier')}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-center',
                    role === 'supplier'
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 shadow-md ring-2 ring-blue-600/20'
                      : 'border-border hover:border-blue-400 bg-card',
                  )}
                >
                  <div
                    className={cn(
                      'p-4 rounded-2xl',
                      role === 'supplier'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Truck className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Fornecedor / Distribuidor</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Catálogo de insumos, recebimento de pedidos dos restaurantes e gestão
                      financeira
                    </p>
                  </div>
                  {role === 'supplier' && (
                    <Badge className="bg-blue-600 text-white text-[10px] font-bold mt-2">
                      <Check className="h-3 w-3 mr-1" /> Selecionado
                    </Badge>
                  )}
                </button>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl text-base gap-2"
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Name & Logo & Team */}
        {step === 2 && (
          <Card className="shadow-lg border-border/60 rounded-2xl animate-fade-in-up">
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">
                  {isRestaurant
                    ? 'Nome do Restaurante / Estabelecimento *'
                    : 'Nome da Distribuidora *'}
                </Label>
                <Input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder={
                    isRestaurant ? 'Ex: Serena Café Bistrô' : 'Ex: Distribuidora Alimentos Brasil'
                  }
                  className="h-12 text-base font-semibold rounded-xl"
                  autoFocus
                />
              </div>

              {/* Logo upload mockup */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Logotipo do Estabelecimento (Opcional)</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/20">
                  <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-foreground">
                      {logoPreview
                        ? 'Logotipo carregado com sucesso'
                        : 'Selecione a imagem do seu logo'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">PNG ou JPG até 5MB</p>
                    <label className="inline-block cursor-pointer">
                      <span className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Escolher arquivo
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Team Invitation Step */}
              {isRestaurant && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-emerald-600" />
                        Convidar Equipe Inicial (Opcional)
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Garçons, cozinheiros e bartenders receberão acesso direto
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTeamMember}
                      className="h-8 text-xs gap-1 rounded-lg"
                    >
                      <Plus className="h-3 w-3" /> Adicionar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {teamEmails.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder="email@funcionario.com"
                          value={member.email}
                          onChange={(e) => handleUpdateTeamMember(idx, 'email', e.target.value)}
                          className="h-9 text-xs rounded-lg flex-1"
                        />
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleUpdateTeamMember(idx, 'role', v)}
                        >
                          <SelectTrigger className="w-32 h-9 text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="waiter">Garçom</SelectItem>
                            <SelectItem value="kitchen">Cozinha</SelectItem>
                            <SelectItem value="bar">Barman</SelectItem>
                          </SelectContent>
                        </Select>
                        {teamEmails.length > 1 && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRemoveTeamMember(idx)}
                            className="h-9 w-9 text-red-500 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isRestaurant && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Prazo Médio de Entrega</Label>
                    <Select value={deliveryLeadTime} onValueChange={setDeliveryLeadTime}>
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 dia (Pronta entrega)</SelectItem>
                        <SelectItem value="2">2 dias</SelectItem>
                        <SelectItem value="3">3 dias</SelectItem>
                        <SelectItem value="5">5 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Região de Atendimento</Label>
                    <Input
                      placeholder="Ex: Grande SP, Capital..."
                      value={deliveryRegions}
                      onChange={(e) => setDeliveryRegions(e.target.value)}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="gap-2 h-12 rounded-xl text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!restaurantName.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl text-base gap-2"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Categories Configuration */}
        {step === 3 && (
          <Card className="shadow-lg border-border/60 rounded-2xl animate-fade-in-up">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  {isRestaurant
                    ? 'Selecione as categorias do seu cardápio'
                    : 'Selecione os segmentos de produtos que você fornece'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Você poderá criar novas ou editar a qualquer momento no painel.
                </p>
              </div>

              {/* Category selector pills */}
              <div className="flex flex-wrap gap-2.5">
                {(isRestaurant ? defaultRestaurantCategories : supplierCategories).map((cat) => {
                  const isSelected = selectedCategories.includes(cat)
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5',
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                          : 'bg-background hover:bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                      {cat}
                    </button>
                  )
                })}
              </div>

              {/* Add custom category inline */}
              <div className="flex gap-2 pt-2 border-t">
                <Input
                  placeholder="Criar outra categoria (ex: Happy Hour, Vinhos)..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomCategory()
                    }
                  }}
                  className="h-10 text-xs rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomCategory}
                  className="h-10 rounded-xl gap-1 text-xs font-bold"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar
                </Button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="gap-2 h-12 rounded-xl text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={selectedCategories.length === 0}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-xl text-base gap-2"
                >
                  Continuar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Plan Selection & Finish */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in-up">
            <div className="grid gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    'relative flex flex-col rounded-2xl border-2 transition-all',
                    plan.highlight
                      ? 'border-emerald-600 shadow-xl bg-card'
                      : 'border-border/80 hover:border-emerald-400 bg-card/60',
                  )}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Recomendado
                    </div>
                  )}

                  <CardContent className="pt-6 flex flex-col flex-1 p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                    </div>

                    <div>
                      <p className="text-3xl font-black text-foreground">
                        {plan.price}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {plan.period}
                        </span>
                      </p>
                    </div>

                    <ul className="space-y-2 flex-1 pt-2 border-t text-xs">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleFinish(plan.name)}
                      disabled={loadingFinish}
                      className={cn(
                        'w-full h-11 rounded-xl font-bold text-sm shadow-sm',
                        plan.highlight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-muted hover:bg-muted/80 text-foreground',
                      )}
                    >
                      {loadingFinish ? 'Configurando...' : `Escolher ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={() => setStep(3)}
              className="w-full gap-2 h-10 text-xs text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar para categorias
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
