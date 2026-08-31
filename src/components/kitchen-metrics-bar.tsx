import React from 'react'
import {
  Clock,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Timer,
  Layers,
  ChefHat,
  Check,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { KitchenMetrics } from '@/hooks/use-kitchen-metrics'

interface KitchenMetricsBarProps {
  metrics: KitchenMetrics
  compact?: boolean
  className?: string
}

export function KitchenMetricsBar({
  metrics,
  compact = false,
  className = '',
}: KitchenMetricsBarProps) {
  const {
    avgPrepTimeMinutes,
    avgWaitTimeMinutes,
    pendingCount,
    preparingCount,
    readyCount,
    totalActiveCount,
    oldestPendingMinutes,
    loadStatus,
    loadStatusLabel,
    loadStatusColor,
    trafficLightText,
  } = metrics

  const statusBgColors = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
    rose: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400',
    red: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400',
  }

  const dotColors = {
    emerald: 'bg-emerald-500 shadow-emerald-500/50',
    amber: 'bg-amber-500 shadow-amber-500/50',
    rose: 'bg-orange-500 shadow-orange-500/50',
    red: 'bg-rose-500 shadow-rose-500/50 animate-ping',
  }

  const solidDotColors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-orange-500',
    red: 'bg-rose-600',
  }

  if (compact) {
    return (
      <div
        className={`rounded-2xl border p-3 sm:p-4 bg-card shadow-xs transition-all ${className}`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Status Semáforo */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full ${solidDotColors[loadStatusColor]}`}
              />
              <span
                className={`absolute inline-block h-3.5 w-3.5 rounded-full opacity-75 ${dotColors[loadStatusColor]}`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Status da Cozinha:
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${statusBgColors[loadStatusColor]}`}
                >
                  {loadStatusLabel}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{trafficLightText}</p>
            </div>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border text-xs shrink-0">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-muted-foreground">Preparo Médio:</span>
              <strong className="font-mono text-foreground">
                {avgPrepTimeMinutes !== null ? `~${avgPrepTimeMinutes} min` : '—'}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border text-xs shrink-0">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-muted-foreground">Fila Total:</span>
              <strong className="font-mono text-foreground font-black">
                {totalActiveCount} {totalActiveCount === 1 ? 'pedido' : 'pedidos'}
              </strong>
            </div>

            {readyCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs shrink-0 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>{readyCount} para servir!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Banner Semáforo & Previsão */}
      <div
        className={`rounded-2xl border p-4 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${statusBgColors[loadStatusColor]}`}
      >
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center shrink-0">
            <span
              className={`inline-block h-4 w-4 rounded-full ${solidDotColors[loadStatusColor]}`}
            />
            <span
              className={`absolute inline-block h-4 w-4 rounded-full opacity-75 ${dotColors[loadStatusColor]}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Semáforo KDS Cozinha
              </span>
              <Badge
                variant="outline"
                className={`font-black text-xs px-2.5 py-0.5 rounded-md ${statusBgColors[loadStatusColor]}`}
              >
                {loadStatusLabel}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm font-semibold mt-0.5">{trafficLightText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {oldestPendingMinutes !== null && oldestPendingMinutes > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/80 border text-xs shadow-2xs">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-muted-foreground">Mais antigo na fila:</span>
              <strong className="font-mono text-foreground">{oldestPendingMinutes} min</strong>
            </div>
          )}
        </div>
      </div>

      {/* Grid of 4 Key KDS Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tempo Médio de Preparo */}
        <Card className="rounded-2xl border-border/60 shadow-xs hover:shadow-sm transition-all bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Timer className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                Tempo Médio Preparo
              </p>
              <h4 className="text-lg sm:text-2xl font-black tracking-tight font-mono text-foreground">
                {avgPrepTimeMinutes !== null ? `${avgPrepTimeMinutes} min` : '—'}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">
                {avgPrepTimeMinutes !== null ? 'Baseado nos últimos pratos' : 'Calculando comanda'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tempo de Espera Médio Atual */}
        <Card className="rounded-2xl border-border/60 shadow-xs hover:shadow-sm transition-all bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                Espera Atual na Fila
              </p>
              <h4 className="text-lg sm:text-2xl font-black tracking-tight font-mono text-foreground">
                {avgWaitTimeMinutes !== null ? `${avgWaitTimeMinutes} min` : '0 min'}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">Média dos pedidos ativos</p>
            </div>
          </CardContent>
        </Card>

        {/* Fila Ativa (Pendentes + Em Cozimento) */}
        <Card className="rounded-2xl border-border/60 shadow-xs hover:shadow-sm transition-all bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                Fila Ativa de Produção
              </p>
              <h4 className="text-lg sm:text-2xl font-black tracking-tight font-mono text-foreground">
                {totalActiveCount}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({pendingCount} triagem, {preparingCount} fogo)
                </span>
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">Em processo na cozinha</p>
            </div>
          </CardContent>
        </Card>

        {/* Prontos para Servir */}
        <Card className="rounded-2xl border-border/60 shadow-xs hover:shadow-sm transition-all bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">
                Prontos para Saída
              </p>
              <h4 className="text-lg sm:text-2xl font-black tracking-tight font-mono text-foreground">
                {readyCount}{' '}
                <span className="text-xs font-normal text-muted-foreground">pratos</span>
              </h4>
              <p className="text-[10px] text-muted-foreground truncate">Aguardando garçom servir</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default KitchenMetricsBar
