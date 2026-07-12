import { DollarSign, TrendingDown, TrendingUp, Percent, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface DishAnalysis {
  name: string
  cmv: number
  margin: number
  grossProfit: number
  profitability: 'healthy' | 'warning' | 'critical'
  monthlyVolume: number
  monthlyProfit: number
}

const dishAnalysis: DishAnalysis[] = [
  {
    name: 'Risoto de Funghi',
    cmv: 28,
    margin: 72,
    grossProfit: 46.8,
    profitability: 'healthy',
    monthlyVolume: 145,
    monthlyProfit: 6786,
  },
  {
    name: 'Salmão Grelhado',
    cmv: 31.7,
    margin: 68.3,
    grossProfit: 61.4,
    profitability: 'healthy',
    monthlyVolume: 112,
    monthlyProfit: 6876.8,
  },
  {
    name: 'Torta de Morango',
    cmv: 29.5,
    margin: 70.4,
    grossProfit: 15.5,
    profitability: 'healthy',
    monthlyVolume: 89,
    monthlyProfit: 1379.5,
  },
]

const financialMetrics = {
  totalRevenue: 43650,
  totalCmv: 12450,
  grossProfit: 31200,
  wasteImpact: 845.3,
  netProfit: 28354.7,
  profitMargin: 64.9,
}

const profitabilityConfig = {
  healthy: {
    label: 'Saudável',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  warning: {
    label: 'Atenção',
    color: 'text-amber-600',
    bg: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  critical: {
    label: 'Crítico',
    color: 'text-red-600',
    bg: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
}

export function AiFinancialPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <DollarSign className="mr-2 h-5 w-5 text-emerald-600" />
          Analista Financeiro IA
        </CardTitle>
        <CardDescription>CMV, margens e lucratividade calculados automaticamente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Receita Total</p>
            <p className="text-lg font-bold font-mono">
              R$ {financialMetrics.totalRevenue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">CMV Total</p>
            <p className="text-lg font-bold font-mono text-red-500">
              R$ {financialMetrics.totalCmv.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="p-3 rounded-lg border">
            <p className="text-xs text-muted-foreground">Lucro Bruto</p>
            <p className="text-lg font-bold font-mono text-emerald-600">
              R$ {financialMetrics.grossProfit.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="p-3 rounded-lg border bg-red-50/50 dark:bg-red-950/20">
            <p className="text-xs text-muted-foreground">Desperdício</p>
            <p className="text-lg font-bold font-mono text-red-500">
              R${' '}
              {financialMetrics.wasteImpact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-medium">Lucro Líquido Projetado</p>
              <p className="text-xs text-muted-foreground">Após desperdícios</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold font-mono text-emerald-600">
              R$ {financialMetrics.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px]">
              {financialMetrics.profitMargin}% margem
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Análise por Prato</h4>
          {dishAnalysis.map((dish) => {
            const config = profitabilityConfig[dish.profitability]
            return (
              <div key={dish.name} className="p-3 rounded-lg border">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-medium truncate">{dish.name}</span>
                  <Badge className={cn('text-[10px] shrink-0', config.badge)}>{config.label}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">CMV: </span>
                    <span className="font-medium">{dish.cmv}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Margem: </span>
                    <span className="font-medium text-emerald-600">{dish.margin}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lucro/prato: </span>
                    <span className="font-medium">R$ {dish.grossProfit}</span>
                  </div>
                </div>
                <Progress value={dish.margin} className="h-1.5" indicatorClassName={config.bg} />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {dish.monthlyVolume} pedidos/mês · Lucro mensal: R${' '}
                  {dish.monthlyProfit.toLocaleString('pt-BR')}
                </p>
              </div>
            )
          })}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>IA detectou:</strong> O desperdício atual (R$ 845,30) representa 2,7% da margem
            de lucro. Reduzir em 50% aumentaria o lucro líquido em R$ 422,65/mês.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
