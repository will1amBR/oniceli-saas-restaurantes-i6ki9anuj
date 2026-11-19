import { useEffect, useMemo, useState } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { getDailyConsumptions, type DailyConsumptionRecord } from '@/services/daily-consumptions'
import { getWasteLogs, type WasteLog } from '@/services/waste-logs'
import { getInventory, type InventoryItem } from '@/services/inventory'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Package, Trash2, TrendingDown } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface WastePanelProps {
  days?: 7 | 30
}

interface DailyRow {
  label: string
  teorico: number
  real: number
  desvio: number
}

interface WasteRankRow {
  name: string
  category: string
  unit: string
  quantity: number
  cost: number
}

const DEMO_DAILY: DailyRow[] = [
  { label: 'D-6', teorico: 312.4, real: 341.8, desvio: 29.4 },
  { label: 'D-5', teorico: 298.1, real: 312.6, desvio: 14.5 },
  { label: 'D-4', teorico: 344.7, real: 378.2, desvio: 33.5 },
  { label: 'D-3', teorico: 286.9, real: 295.3, desvio: 8.4 },
  { label: 'D-2', teorico: 401.5, real: 428.9, desvio: 27.4 },
  { label: 'D-1', teorico: 366.2, real: 391.4, desvio: 25.2 },
  { label: 'Hoje', teorico: 352.8, real: 403.1, desvio: 50.3 },
]

const DEMO_RANK: WasteRankRow[] = [
  { name: 'Frango Grelhado', category: 'Proteínas', unit: 'kg', quantity: 3.6, cost: 43.2 },
  { name: 'Salmão Fresco', category: 'Peixes', unit: 'kg', quantity: 1.8, cost: 71.4 },
  { name: 'Abacate', category: 'Hortifruti', unit: 'un', quantity: 7, cost: 24.5 },
  { name: 'Mix de Folhas', category: 'Hortifruti', unit: 'kg', quantity: 2.4, cost: 18.6 },
  { name: 'Manteiga Premium', category: 'Frios', unit: 'kg', quantity: 1.2, cost: 14.4 },
]

function parseItems(raw: string | unknown[] | null | undefined): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw || '[]')
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/**
 * Painel "Desperdício / Desvios" do dono: lê os registros reais de
 * daily_consumptions (fechamentos diários) + waste_logs (reconciliações
 * de estoque) e consolida histórico, gráfico teórico vs real e ranking
 * de insumos mais desperdiçados. Sem registros reais, mostra dados demo.
 */
export function WastePanel({ days: initialDays = 7 }: WastePanelProps) {
  const [days, setDays] = useState<7 | 30>(initialDays)
  const [consumptions, setConsumptions] = useState<DailyConsumptionRecord[]>([])
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const [cons, logs, inv] = await Promise.all([
      getDailyConsumptions().catch(() => [] as DailyConsumptionRecord[]),
      getWasteLogs().catch(() => [] as WasteLog[]),
      getInventory().catch(() => [] as InventoryItem[]),
    ])
    setConsumptions(cons)
    setWasteLogs(logs)
    setInventory(inv)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useRealtime('daily_consumptions', () => loadData())
  useRealtime('waste_logs', () => loadData())

  const invById = useMemo(() => {
    const map = new Map<string, InventoryItem>()
    inventory.forEach((i) => map.set(i.id, i))
    return map
  }, [inventory])

  const cutoff = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - days)
    return d.toISOString().split('T')[0]
  }, [days])

  // Registros de fechamento dentro do período
  const records = useMemo(
    () =>
      consumptions
        .filter((c) => {
          const day = (c.date || '').split(' ')[0]
          return !cutoff || day >= cutoff
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [consumptions, cutoff],
  )

  const dailyRows: DailyRow[] = useMemo(() => {
    if (records.length === 0) return DEMO_DAILY.slice(DEMO_DAILY.length - Math.min(days, 7))
    return records.map((rec) => {
      const dayLabel = (rec.date || '').split(' ')[0].split('-').slice(2).join('/')
      return {
        label: dayLabel,
        teorico: rec.total_theoretical_cost || 0,
        real: rec.total_real_cost || 0,
        desvio: rec.total_divergence_cost || 0,
      }
    })
  }, [records, days])

  const ranking: WasteRankRow[] = useMemo(() => {
    if (records.length === 0 && wasteLogs.length === 0) return DEMO_RANK
    const agg = new Map<string, WasteRankRow>()
    // 1. Do fechamento diário (itens com desvio)
    records.forEach((rec) => {
      parseItems(rec.items).forEach((raw) => {
        const cost = Number(raw.divergence_cost || 0)
        const qty = Number(raw.difference_quantity || 0)
        if (cost <= 0) return
        const name = String(raw.name || 'Insumo')
        const existing = agg.get(name)
        if (existing) {
          existing.quantity += qty
          existing.cost += cost
        } else {
          agg.set(name, {
            name,
            category: String(raw.category || 'Geral'),
            unit: String(raw.unit || 'un'),
            quantity: qty,
            cost,
          })
        }
      })
    })
    // 2. Dos logs de desperdício (reconciliações de estoque)
    wasteLogs.forEach((log) => {
      const loss = Number(log.financial_loss || 0)
      if (loss <= 0) return
      const day = (log.date || '').split(' ')[0]
      if (cutoff && day < cutoff) return
      const inv = log.expand?.item_id as
        | { name?: string; unit?: string; category?: string }
        | undefined
      const name = inv?.name || invById.get(log.item_id)?.name || 'Insumo'
      const unit = inv?.unit || invById.get(log.item_id)?.unit || 'un'
      const category = inv?.category || invById.get(log.item_id)?.category || 'Geral'
      const existing = agg.get(name)
      if (existing) {
        existing.quantity += Number(log.quantity || 0)
        existing.cost += loss
      } else {
        agg.set(name, {
          name,
          category,
          unit,
          quantity: Number(log.quantity || 0),
          cost: loss,
        })
      }
    })
    return [...agg.values()].sort((a, b) => b.cost - a.cost).slice(0, 8)
  }, [records, wasteLogs, invById, cutoff])

  const totalDesvio = dailyRows.reduce((s, r) => s + r.desvio, 0)
  const totalTeorico = dailyRows.reduce((s, r) => s + r.teorico, 0)
  const totalReal = dailyRows.reduce((s, r) => s + r.real, 0)
  const wastePct = totalTeorico > 0 ? (totalDesvio / totalTeorico) * 100 : 0
  const hasRealData = records.length > 0

  return (
    <Card className="rounded-2xl border-border/60 shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-600" />
            Desperdício / Desvios
          </CardTitle>
          <CardDescription className="text-xs">
            Consumo teórico vs real (fechamento diário) e reconciliações de estoque
            {hasRealData ? '' : ' — dados de demonstração'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {!hasRealData && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold bg-amber-50 text-amber-700 border-amber-200"
            >
              DEMO
            </Badge>
          )}
          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as 7 | 30)}>
            <TabsList className="bg-muted/70 p-1 rounded-xl h-9">
              <TabsTrigger value="7" className="rounded-lg text-xs font-bold px-3">
                7 dias
              </TabsTrigger>
              <TabsTrigger value="30" className="rounded-lg text-xs font-bold px-3">
                30 dias
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-10 text-center text-muted-foreground text-sm font-bold">
            Carregando histórico de desperdício...
          </div>
        ) : (
          <>
            {/* Resumo do período */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Desvio Total
                </p>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
                  R$ {totalDesvio.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">
                  Custo Teórico
                </p>
                <p className="text-lg font-black font-mono">R$ {totalTeorico.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Custo Real</p>
                <p className="text-lg font-black font-mono">R$ {totalReal.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">% de Perda</p>
                <p className="text-lg font-black font-mono text-amber-600">
                  {wastePct.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Gráfico: custo teórico vs real */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wasteTeorico" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="wasteReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} />
                  <YAxis fontSize={11} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    formatter={(val: number) => [`R$ ${val.toFixed(2)}`, '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--card)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="teorico"
                    name="Custo Teórico"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#wasteTeorico)"
                  />
                  <Area
                    type="monotone"
                    dataKey="real"
                    name="Custo Real"
                    stroke="#e11d48"
                    strokeWidth={2}
                    fill="url(#wasteReal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Ranking dos insumos mais desperdiçados */}
            <div className="border-t pt-3">
              <p className="text-sm font-bold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-rose-500" />
                Ranking de insumos mais desperdiçados ({days} dias)
              </p>
              {ranking.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Nenhum desperdício registrado no período. 🎉
                </div>
              ) : (
                <div className="space-y-1.5">
                  {ranking.map((row, idx) => (
                    <div
                      key={row.name}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div
                        className={`h-7 w-7 shrink-0 rounded-lg flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm truncate">{row.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Package className="h-3 w-3" />
                          {row.category} • {row.quantity.toFixed(2).replace('.', ',')} {row.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {idx === 0 && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                        <span className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                          R$ {row.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
