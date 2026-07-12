import {
  Sparkles,
  Package,
  Trash2,
  DollarSign,
  Megaphone,
  TrendingUp,
  Bot,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  aiAgentStatuses,
  aiRecommendations,
  promotionalCopies,
  supplierForecasts,
  inventoryAnalysis,
  type AIRecommendation,
} from '@/lib/ai-data'

const agentIcons: Record<string, typeof Package> = {
  Package,
  Trash2,
  DollarSign,
  Megaphone,
  TrendingUp,
}

const priorityConfig: Record<AIRecommendation['priority'], { label: string; className: string }> = {
  critical: {
    label: 'Crítico',
    className: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
  warning: {
    label: 'Atenção',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  info: {
    label: 'Info',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  },
  success: {
    label: 'Sucesso',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
}

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  active: { label: 'Ativo', className: 'text-emerald-600', dot: 'bg-emerald-500' },
  idle: { label: 'Ocioso', className: 'text-blue-600', dot: 'bg-blue-500' },
  alert: { label: 'Alerta', className: 'text-red-600', dot: 'bg-red-500' },
}

function RecommendationCard({ rec }: { rec: AIRecommendation }) {
  const config = priorityConfig[rec.priority]
  return (
    <div className="p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold leading-tight">{rec.title}</h4>
        <Badge className={cn('text-[10px] shrink-0', config.className)}>{config.label}</Badge>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{rec.description}</p>
      {rec.impact && <p className="text-xs font-medium text-emerald-600 mb-2">{rec.impact}</p>}
      <div className="flex items-center justify-between">
        {rec.action && (
          <Button variant="outline" size="sm" className="text-xs h-7">
            {rec.action}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
        <span className="text-[10px] text-muted-foreground/70 ml-auto">{rec.date}</span>
      </div>
    </div>
  )
}

export function AiAgentsPanel() {
  return (
    <div className="space-y-4">
      <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse-glow" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center text-base md:text-lg">
            <Bot className="mr-2 h-5 w-5 text-emerald-600" />
            Central de Agentes IA
          </CardTitle>
          <CardDescription>5 agentes ativos monitorando sua operação 24/7</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {aiAgentStatuses.map((agent) => {
              const Icon = agentIcons[agent.icon] || Bot
              const status = statusConfig[agent.status]
              return (
                <div key={agent.name} className="p-3 rounded-lg bg-background border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-950/40 p-1.5">
                      <Icon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className={cn('w-2 h-2 rounded-full', status.dot)}>
                      <span
                        className={cn('block w-2 h-2 rounded-full animate-pulse', status.dot)}
                      />
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold leading-tight">{agent.name}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                    {agent.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={cn('text-[10px] font-medium', status.className)}>
                      {status.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{agent.lastRun}</span>
                  </div>
                  {agent.findings > 0 && (
                    <Badge className="mt-1.5 text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {agent.findings} achados
                    </Badge>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="recommendations">
        <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="recommendations" className="text-xs">
            Recomendações
          </TabsTrigger>
          <TabsTrigger value="inventory" className="text-xs">
            Estoque IA
          </TabsTrigger>
          <TabsTrigger value="promotions" className="text-xs">
            Promoções
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="text-xs">
            Previsões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {aiRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                Análise de Estoque Automatizada
              </CardTitle>
              <CardDescription>
                Consumo médio, dias restantes e necessidade de reposição
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-xs">Item</th>
                      <th className="text-left p-3 font-medium text-xs hidden sm:table-cell">
                        Consumo Médio
                      </th>
                      <th className="text-right p-3 font-medium text-xs">Dias Rest.</th>
                      <th className="text-center p-3 font-medium text-xs hidden md:table-cell">
                        Lead Time
                      </th>
                      <th className="text-center p-3 font-medium text-xs">Reposição</th>
                      <th className="text-left p-3 font-medium text-xs hidden lg:table-cell">
                        Qtd Rec.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryAnalysis.map((item, i) => (
                      <tr key={i} className="border-t hover:bg-muted/30">
                        <td className="p-3 font-medium">{item.item}</td>
                        <td className="p-3 text-muted-foreground hidden sm:table-cell">
                          {item.avgConsumption}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={cn(
                              'font-mono',
                              item.daysRemaining <= 2 ? 'text-red-500' : 'text-foreground',
                            )}
                          >
                            {item.daysRemaining}
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground hidden md:table-cell">
                          {item.leadTime}d
                        </td>
                        <td className="p-3 text-center">
                          {item.needsReposition ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px]">
                              Sim
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px]">
                              Não
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground hidden lg:table-cell">
                          {item.recommendedQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="mt-4">
          <div className="grid gap-3 md:grid-cols-3">
            {promotionalCopies.map((promo) => (
              <Card key={promo.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {promo.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{promo.product}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-xs text-foreground bg-muted/50 rounded-lg p-3 flex-1 leading-relaxed">
                    {promo.copy}
                  </p>
                  <Button size="sm" variant="outline" className="mt-3 text-xs">
                    <Megaphone className="mr-1 h-3 w-3" />
                    Copiar Texto
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="forecasts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Previsão de Demanda & Fornecedores
              </CardTitle>
              <CardDescription>Notificações enviadas com 3 dias de antecedência</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium text-xs">Fornecedor</th>
                      <th className="text-left p-3 font-medium text-xs">Produto</th>
                      <th className="text-right p-3 font-medium text-xs">Qtd Est.</th>
                      <th className="text-center p-3 font-medium text-xs hidden sm:table-cell">
                        Entrega
                      </th>
                      <th className="text-center p-3 font-medium text-xs hidden md:table-cell">
                        Confiança
                      </th>
                      <th className="text-center p-3 font-medium text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplierForecasts.map((fc) => (
                      <tr key={fc.id} className="border-t hover:bg-muted/30">
                        <td className="p-3 text-xs">{fc.supplier}</td>
                        <td className="p-3 font-medium text-xs">{fc.product}</td>
                        <td className="p-3 text-right font-mono text-xs">{fc.estimatedQty}</td>
                        <td className="p-3 text-center text-muted-foreground text-xs hidden sm:table-cell">
                          {fc.deliveryDate}
                        </td>
                        <td className="p-3 text-center hidden md:table-cell">
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${fc.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {fc.confidence}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {fc.status === 'urgent' ? (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-[10px]">
                              Urgente
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 text-[10px]">
                              Notificado
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
