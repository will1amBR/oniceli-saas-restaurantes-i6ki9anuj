import {
  ArrowDownIcon,
  ArrowUpIcon,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  PackageX,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { mockKPIs, mockAlerts, mockAIInsights, mockChartData } from '@/lib/data'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

export default function Index() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Visão Executiva
        </h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao Oniceli. Aqui está o resumo da sua operação hoje.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              R$ {mockKPIs.estoqueDisponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpIcon className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+2.5%</span> em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CMV Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {mockKPIs.cmvAtual}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Meta: 30% (Saudável)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{mockKPIs.margemLucro}%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowUpIcon className="mr-1 h-3 w-3 text-emerald-500" />
              <span className="text-emerald-500 font-medium">+1.2%</span> esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              R$ {mockKPIs.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500" />
              <span className="text-red-500 font-medium">-0.5%</span> em relação a ontem
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts */}
        <Card className="lg:col-span-4 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Vendas x Custos</CardTitle>
            <CardDescription>Acompanhamento mensal da rentabilidade</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
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

        {/* AI & Alerts */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse-glow" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-emerald-800 dark:text-emerald-400">
                <Sparkles className="mr-2 h-5 w-5 text-emerald-600" />
                Insights Oniceli AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              {mockAIInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-sm"
                >
                  <h4 className="text-sm font-semibold flex justify-between items-center text-slate-800 dark:text-slate-200">
                    {insight.title}
                    <Badge
                      variant="secondary"
                      className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px]"
                    >
                      {insight.type === 'buy' ? 'Previsão' : 'Ação Recomendada'}
                    </Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  <p className="text-xs font-medium text-emerald-600 mt-2">{insight.savings}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
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
                    className={`mt-0.5 rounded-full p-1.5 ${alert.type === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
                  >
                    {alert.type === 'critical' ? (
                      <PackageX className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{alert.title}</h4>
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
    </div>
  )
}
