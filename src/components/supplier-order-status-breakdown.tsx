import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getOrdersForSupplier, type Order } from '@/services/orders'
import { useRealtime } from '@/hooks/use-realtime'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-600', bg: 'bg-amber-500' },
  processing: { label: 'Em Processamento', color: 'text-blue-600', bg: 'bg-blue-500' },
  shipped: { label: 'Enviado', color: 'text-cyan-600', bg: 'bg-cyan-500' },
  delivered: { label: 'Entregue', color: 'text-emerald-600', bg: 'bg-emerald-500' },
  cancelled: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-500' },
}

const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export function SupplierOrderStatusBreakdown({ supplierId }: { supplierId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!supplierId) return
    try {
      setOrders(await getOrdersForSupplier(supplierId))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [supplierId])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('orders', () => loadData())

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const total = orders.length
  const counts = statusOrder.reduce(
    (acc, status) => {
      acc[status] = orders.filter((o) => o.status === status).length
      return acc
    },
    {} as Record<string, number>,
  )

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribuição de Pedidos por Status</CardTitle>
        <CardDescription>
          {total} pedido{total !== 1 ? 's' : ''} no total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusOrder.map((status) => {
          const config = statusConfig[status]
          const count = counts[status] || 0
          const pct = total > 0 ? (count / total) * 100 : 0
          const revenue = orders
            .filter((o) => o.status === status)
            .reduce((sum, o) => sum + (o.total_amount || 0), 0)

          return (
            <div key={status} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${config.bg}`} />
                  <span className="font-medium">{config.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground font-mono text-xs">{fmt(revenue)}</span>
                  <Badge variant="outline" className={config.color}>
                    {count} ({pct.toFixed(0)}%)
                  </Badge>
                </div>
              </div>
              <Progress value={pct} className={`h-2 [&>div]:${config.bg}`} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
