import { Sparkles, AlertTriangle, PackageX, Gauge } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/kpi-card'
import { AiAgentsPanel } from '@/components/ai-agents-panel'
import { AiFinancialPanel } from '@/components/ai-financial-panel'
import { mockKPIs, mockAlerts, mockChartData } from '@/lib/data'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'

const scoreColor = (score: number) => {
  if (score >= 80) return { color: 'text-emerald-600', bg: 'bg-emerald-500', label: 'Excelente' }
  if (score >= 60) return { color: 'text-amber-600', bg: 'bg-amber-500', label: 'Atenção' }
  return { color: 'text-red-600', bg: 'bg-red-500', label: 'Crítico' }
}

export default function Index() {
  const score = scoreColor(mockKPIs.scoreOperacional)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Visão Executiva
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Bem-vindo ao Oniceli. Aqui está o resumo da sua operação hoje.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Estoque Disponível"
          value={`R$ ${mockKPIs.estoqueDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={{ value: '+2.5%', positive: true, label: 'vs mês anterior' }}
        />
        <KPICard
          title="CMV Atual"
          value={`${mockKPIs.cmvAtual}%`}
          variant="success"
          subtitle="Meta: 30% (Saudável)"
        />
        <KPICard
          title="Margem de Lucro"
          value={`${mockKPIs.margemLucro}%`}
          trend={{ value: '+1.2%', positive: true, label: 'esta semana' }}
        />
        <KPICard
          title="Ticket Médio"
          value={`R$ ${mockKPIs.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={{ value: '-0.5%', positive: false, label: 'vs ontem' }}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Itens Críticos"
          value={String(mockKPIs.itensCriticos)}
          variant="danger"
          subtitle="Requer ação imediata"
        />
        <KPICard
          title="Próx. ao Vencimento"
          value={String(mockKPIs.itensProximosVencimento)}
          variant="warning"
          subtitle="Próximos 3 dias"
        />
        <KPICard
          title="Desperdício Est."
          value={`R$ ${mockKPIs.desperdicioEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          variant="danger"
          subtitle="+15% vs mês anterior"
        />
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Score Operacional</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl md:text-2xl font-bold font-mono ${score.color}`}>
              {mockKPIs.scoreOperacional}/100
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${score.bg} shrink-0`} />
              <span className="text-xs text-muted-foreground">{score.label}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <AiAgentsPanel />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Vendas x Custos</CardTitle>
            <CardDescription>Acompanhamento mensal da rentabilidade</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCustos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value) => [`R$ ${value}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="vendas"
                  name="Vendas"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVendas)"
                />
                <Area
                  type="monotone"
                  dataKey="custos"
                  name="Custos"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCustos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse-glow" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-emerald-800 dark:text-emerald-400 text-base md:text-lg">
                <Sparkles className="mr-2 h-5 w-5 text-emerald-600 shrink-0" />
                Insights Oniceli AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                <h4 className="text-sm font-semibold flex justify-between items-center gap-2 text-slate-800 dark:text-slate-200">
                  <span className="truncate">Sugestão de Compra</span>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] shrink-0"
                  >
                    Previsão
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Previsto aumento de 15% no preço do Tomate. Sugerido comprar 20kg.
                </p>
                <p className="text-xs font-medium text-emerald-600 mt-2">Economia est. R$ 45,00</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
                <h4 className="text-sm font-semibold flex justify-between items-center gap-2 text-slate-800 dark:text-slate-200">
                  <span className="truncate">Otimização de Desperdício</span>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] shrink-0"
                  >
                    Ação
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  5kg de Morango próximos ao vencimento. Sugestão: Promoção "Torta de Morango".
                </p>
                <p className="text-xs font-medium text-emerald-600 mt-2">
                  Recuperação est. R$ 120,00
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-base md:text-lg">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500 shrink-0" />
                Alertas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-3 items-start border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <div
                    className={`mt-0.5 rounded-full p-1.5 shrink-0 ${alert.type === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                  >
                    {alert.type === 'critical' ? (
                      <PackageX className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium truncate">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                      {alert.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{alert.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <AiFinancialPanel />
    </div>
  )
}
