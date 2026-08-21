import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { InventoryItem } from '@/services/inventory'
import type { SaleRecord } from '@/services/sales'
import type { MenuItem } from '@/services/menu-items'

interface IngredientAbcItem {
  id: string
  name: string
  category: string
  unit: string
  unitCost: number
  quantityConsumed: number
  totalConsumptionValue: number
  stockValue: number
  currentStock: number
  realStock?: number
  deviationPercentage: number
  hasSuspiciousDeviation: boolean
  abcCategory: 'A' | 'B' | 'C'
  percentageOfTotal: number
}

interface Props {
  inventory: InventoryItem[]
  sales: SaleRecord[]
  menuItems: MenuItem[]
}

export function RestaurantAbcCurve({ inventory, sales, menuItems }: Props) {
  const analysisData = useMemo(() => {
    // 1. Calculate consumption per ingredient based on sales data & recipes
    const consumptionMap: Record<string, number> = {}

    sales.forEach((sale) => {
      const menuItem = menuItems.find((m) => m.id === sale.item_id)
      if (!menuItem || !menuItem.ingredients) return

      try {
        const ingredients = JSON.parse(menuItem.ingredients)
        if (!Array.isArray(ingredients)) return

        ingredients.forEach((ing) => {
          if (ing.inventory_id) {
            const qtyPerPortion = ing.quantity || 0
            const totalQty = qtyPerPortion * (sale.quantity_sold || 1)
            consumptionMap[ing.inventory_id] = (consumptionMap[ing.inventory_id] || 0) + totalQty
          }
        })
      } catch {
        /* ignore */
      }
    })

    // 2. Map all inventory items with consumption values
    const list = inventory.map((inv) => {
      const consumedQty = consumptionMap[inv.id] || 0
      const consumptionValue = consumedQty * (inv.unit_cost || 0)
      const stockVal = inv.quantity * (inv.unit_cost || 0)

      // Calculate deviation between theoretical vs real stock
      let deviationPct = 0
      let hasDeviation = false
      if (inv.real_stock_ml !== undefined && inv.dose_padrao_ml && inv.quantity > 0) {
        const diff = Math.abs(inv.quantity - inv.real_stock_ml)
        deviationPct = (diff / inv.quantity) * 100
        hasDeviation = deviationPct > 5 && diff > 30
      }

      return {
        id: inv.id,
        name: inv.name,
        category: inv.category || 'Geral',
        unit: inv.unit || 'un',
        unitCost: inv.unit_cost || 0,
        quantityConsumed: consumedQty,
        totalConsumptionValue: consumptionValue,
        stockValue: stockVal,
        currentStock: inv.quantity,
        realStock: inv.real_stock_ml,
        deviationPercentage: deviationPct,
        hasSuspiciousDeviation: hasDeviation,
        abcCategory: 'C' as 'A' | 'B' | 'C',
        percentageOfTotal: 0,
      }
    })

    // Sort descending by consumption value (or stock value if no sales yet)
    list.sort((a, b) => {
      if (b.totalConsumptionValue !== a.totalConsumptionValue) {
        return b.totalConsumptionValue - a.totalConsumptionValue
      }
      return b.stockValue - a.stockValue
    })

    const totalVal = list.reduce(
      (sum, item) => sum + (item.totalConsumptionValue || item.stockValue),
      0,
    )

    let accumulated = 0
    list.forEach((item) => {
      const itemVal = item.totalConsumptionValue || item.stockValue
      accumulated += itemVal
      const cumulativePct = totalVal > 0 ? (accumulated / totalVal) * 100 : 0
      item.percentageOfTotal = totalVal > 0 ? (itemVal / totalVal) * 100 : 0

      if (cumulativePct <= 75) {
        item.abcCategory = 'A'
      } else if (cumulativePct <= 95) {
        item.abcCategory = 'B'
      } else {
        item.abcCategory = 'C'
      }
    })

    return { list, totalVal }
  }, [inventory, sales, menuItems])

  const itemsA = analysisData.list.filter((i) => i.abcCategory === 'A')
  const itemsB = analysisData.list.filter((i) => i.abcCategory === 'B')
  const itemsC = analysisData.list.filter((i) => i.abcCategory === 'C')

  const valA = itemsA.reduce((s, i) => s + (i.totalConsumptionValue || i.stockValue), 0)
  const valB = itemsB.reduce((s, i) => s + (i.totalConsumptionValue || i.stockValue), 0)
  const valC = itemsC.reduce((s, i) => s + (i.totalConsumptionValue || i.stockValue), 0)

  const suspiciousItems = analysisData.list.filter((i) => i.hasSuspiciousDeviation)

  const chartData = analysisData.list.slice(0, 10).map((item) => ({
    name: item.name.length > 14 ? item.name.substring(0, 14) + '…' : item.name,
    fullName: item.name,
    value: item.totalConsumptionValue || item.stockValue,
    category: item.abcCategory,
    unit: item.unit,
  }))

  const colors = {
    A: '#10b981', // emerald
    B: '#f59e0b', // amber
    C: '#64748b', // slate
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* Suspicious deviation alerts */}
      {suspiciousItems.length > 0 && (
        <Card className="border-red-400 bg-red-50/80 dark:bg-red-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-red-900 dark:text-red-200 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
              Alerta de Desvio de Consumo / Estoque (&gt; 5%)
            </CardTitle>
            <CardDescription className="text-red-800 dark:text-red-300">
              Foram detectadas discrepâncias suspeitas entre o consumo teórico do sistema e a
              contagem física real.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {suspiciousItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-background rounded-lg border border-red-200 dark:border-red-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-foreground text-sm">{item.name}</span>
                  <p className="text-muted-foreground mt-0.5">
                    Estoque Teórico:{' '}
                    <strong>
                      {item.currentStock} {item.unit}
                    </strong>{' '}
                    · Contagem Real:{' '}
                    <strong className="text-red-600">
                      {item.realStock} {item.unit}
                    </strong>
                  </p>
                </div>
                <Badge className="bg-red-600 text-white font-bold text-xs">
                  Desvio: {item.deviationPercentage.toFixed(1)}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ABC Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-emerald-500 text-white font-bold">Classe A (Críticos)</Badge>
              <span className="text-xs text-muted-foreground">
                {analysisData.totalVal > 0 ? ((valA / analysisData.totalVal) * 100).toFixed(1) : 0}%
                do valor
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{fmt(valA)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {itemsA.length} ingrediente(s) · Alto impacto financeiro (~75%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-amber-500 text-white font-bold">Classe B (Intermediários)</Badge>
              <span className="text-xs text-muted-foreground">
                {analysisData.totalVal > 0 ? ((valB / analysisData.totalVal) * 100).toFixed(1) : 0}%
                do valor
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{fmt(valB)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {itemsB.length} ingrediente(s) · Médio impacto (~20%)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-slate-500 text-white font-bold">Classe C (Baixo Impacto)</Badge>
              <span className="text-xs text-muted-foreground">
                {analysisData.totalVal > 0 ? ((valC / analysisData.totalVal) * 100).toFixed(1) : 0}%
                do valor
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-700">{fmt(valC)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {itemsC.length} ingrediente(s) · Baixo valor (~5%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart of Top Consumed / Value Ingredients */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Curva ABC — Top Ingredientes por Impacto Financeiro</span>
              <Badge variant="outline" className="text-xs font-normal">
                Classificação A / B / C
              </Badge>
            </CardTitle>
            <CardDescription>
              Representatividade de cada insumo no custo e consumo do restaurante.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: any, _name: any, item: any) => [
                    `${fmt(Number(value))}`,
                    `Classe ${item.payload.category}`,
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={colors[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
