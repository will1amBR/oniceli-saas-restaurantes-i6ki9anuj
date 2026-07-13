import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  Package,
  AlertTriangle,
  TrendingDown,
  DollarSign,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getInventory, type InventoryItem } from '@/services/inventory'
import { getSales, type SaleRecord } from '@/services/sales'
import { getWasteLogs, type WasteLog } from '@/services/waste-logs'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import { StatusBadge } from '@/components/status-badge'

export default function Index() {
  const { user } = useAuth()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)

  const restaurantName = user?.name || 'Serena Café'

  const loadData = useCallback(async () => {
    try {
      const [inv, sal, waste, menu] = await Promise.all([
        getInventory(),
        getSales(),
        getWasteLogs(),
        getMenuItems(),
      ])
      setInventory(inv)
      setSales(sal)
      setWasteLogs(waste)
      setMenuItems(menu)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('inventory', () => loadData())
  useRealtime('sales_data', () => loadData())
  useRealtime('waste_logs', () => loadData())

  const topMenuItems = useMemo(() => {
    return [...menuItems].slice(0, 5)
  }, [menuItems])

  if (user?.role === 'supplier') return <Navigate to="/supplier/dashboard" replace />

  const stockValue = inventory.reduce((s, i) => s + i.quantity * i.unit_cost, 0)
  const criticalItems = inventory.filter((i) => i.status === 'critical' || i.status === 'expired')
  const wasteCost = wasteLogs.reduce((s, w) => s + (w.financial_loss || 0), 0)
  const totalSales = sales.reduce((s, w) => s + (w.total_price || 0), 0)

  const kpis = [
    {
      label: 'Valor em Estoque',
      value: `R$ ${stockValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      label: 'Itens Críticos',
      value: String(criticalItems.length),
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      label: 'Total Vendas',
      value: `R$ ${totalSales.toFixed(2)}`,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      label: 'Custo Desperdício',
      value: `R$ ${wasteCost.toFixed(2)}`,
      icon: TrendingDown,
      color: 'text-amber-500',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{restaurantName}</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio em tempo real.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl md:text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <kpi.icon className={`h-8 w-8 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertas de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!loading && criticalItems.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alerta. Tudo sob controle!</p>
            )}
            {criticalItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} {item.unit} (mín: {item.min_stock})
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Desperdícios Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
            {!loading && wasteLogs.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum desperdício registrado.</p>
            )}
            {wasteLogs.slice(0, 5).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between gap-2 p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium text-sm">{w.expand?.item_id?.name || 'Item'}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.reason} — {w.quantity} un.
                  </p>
                </div>
                <Badge variant="outline" className="text-red-600">
                  R$ {(w.financial_loss || 0).toFixed(2)}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Pratos do Cardápio
          </CardTitle>
          <Button variant="ghost" size="sm" asChild className="text-primary">
            <Link to="/cardapios">
              Ver tudo <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!loading && menuItems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum prato encontrado para o seu restaurante.
            </p>
          )}
          {!loading && menuItems.length > 0 && (
            <div className="space-y-2">
              {topMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category || 'Sem categoria'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="text-emerald-600">
                      {(item.margin || 0).toFixed(1)}%
                    </Badge>
                    <span className="text-sm font-semibold">R$ {(item.price || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
