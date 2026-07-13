import { useState, useEffect, useCallback } from 'react'
import { Wallet, CreditCard, Smartphone, Clock } from 'lucide-react'
import { KPICard } from '@/components/kpi-card'
import { getOrdersForSupplier, type Order } from '@/services/orders'
import { useRealtime } from '@/hooks/use-realtime'

export function SupplierFinancialSummary({ supplierId }: { supplierId: string }) {
  const [orders, setOrders] = useState<Order[]>([])

  const loadData = useCallback(async () => {
    if (!supplierId) return
    try {
      setOrders(await getOrdersForSupplier(supplierId))
    } catch {
      /* ignore */
    }
  }, [supplierId])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('orders', () => loadData())

  const pending = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered')
  const pixTotal = pending
    .filter((o) => o.payment_method === 'pix')
    .reduce((s, o) => s + (o.total_amount || 0), 0)
  const cardTotal = pending
    .filter((o) => o.payment_method === 'card')
    .reduce((s, o) => s + (o.total_amount || 0), 0)
  const instTotal = pending
    .filter((o) => o.payment_method === 'installments')
    .reduce((s, o) => s + (o.total_amount || 0), 0)
  const total = pixTotal + cardTotal + instTotal

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Contas a Receber</h2>
        <p className="text-sm text-muted-foreground">Total em aberto: {fmt(total)}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Pix" value={fmt(pixTotal)} icon={Smartphone} variant="success" />
        <KPICard title="Cartão" value={fmt(cardTotal)} icon={CreditCard} />
        <KPICard title="Parcelado" value={fmt(instTotal)} icon={Clock} variant="warning" />
        <KPICard title="Total a Receber" value={fmt(total)} icon={Wallet} />
      </div>
    </div>
  )
}
