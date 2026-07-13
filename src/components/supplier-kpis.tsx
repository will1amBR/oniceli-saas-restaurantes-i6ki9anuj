import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, DollarSign, Truck, PackageCheck, Loader2 } from 'lucide-react'
import { KPICard } from '@/components/kpi-card'
import { getOrdersForSupplier, type Order } from '@/services/orders'

interface SupplierKPIsProps {
  supplierId: string
}

export function SupplierKPIs({ supplierId }: SupplierKPIsProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
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

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending' || o.status === 'processing')
  const shippedOrders = orders.filter((o) => o.status === 'shipped')
  const deliveredOrders = orders.filter((o) => o.status === 'delivered')
  const totalRevenue = orders
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Pedidos Pendentes"
        value={String(pendingOrders.length)}
        icon={ClipboardList}
        variant="warning"
        subtitle={
          pendingOrders.length > 0
            ? `R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em aberto`
            : 'Nenhum pendente'
        }
      />
      <KPICard
        title="Receita Total Entregue"
        value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon={DollarSign}
        variant="success"
        subtitle={`${deliveredOrders.length} pedidos entregues`}
      />
      <KPICard
        title="Em Trânsito"
        value={String(shippedOrders.length)}
        icon={Truck}
        variant="default"
        subtitle={shippedOrders.length > 0 ? 'Aguardando confirmação' : 'Nenhum envio ativo'}
      />
      <KPICard
        title="Total de Pedidos"
        value={String(orders.length)}
        icon={PackageCheck}
        variant="default"
        subtitle={`${deliveredOrders.length} entregues · ${orders.filter((o) => o.status === 'cancelled').length} cancelados`}
      />
    </div>
  )
}
