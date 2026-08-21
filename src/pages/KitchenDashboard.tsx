import { useState, useEffect } from 'react'
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Check,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
  type KitchenOrder,
  type KitchenOrderItem,
} from '@/services/kitchen-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { OrderCardSkeleton } from '@/components/loading-skeletons'
import { ErrorState } from '@/components/error-state'
import { StatusBadge } from '@/components/status-badge'

export default function KitchenDashboard() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')

  const loadOrders = async () => {
    try {
      setError(false)
      const data = await getKitchenOrders()
      // Sort: pending first, then preparing, then ready
      setOrders(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useRealtime('kitchen_orders', () => loadOrders())

  const handleStatusChange = async (
    order: KitchenOrder,
    newStatus: 'pending' | 'preparing' | 'ready' | 'delivered',
  ) => {
    try {
      await updateKitchenOrderStatus(order.id, newStatus)

      toast({
        title: 'Status atualizado!',
        description: `Mesa ${order.table_number || '01'} agora está: ${newStatus.toUpperCase()}`,
        className: 'bg-emerald-600 text-white font-bold',
      })
      loadOrders()
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return o.status !== 'delivered'
    return o.status === filter
  })

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const readyCount = orders.filter((o) => o.status === 'ready').length

  const getElapsedTime = (createdStr: string) => {
    if (!createdStr) return '0 min'
    const created = new Date(createdStr)
    const diffMin = Math.floor((Date.now() - created.getTime()) / 60000)
    return `${diffMin} min`
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            KDS Cozinha
            <Badge className="bg-amber-600 text-white text-[10px] font-bold">Display KDS</Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor de comandas e tempo de preparo de pratos em tempo real.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
              filter === 'all'
                ? 'bg-foreground text-background shadow-md'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Todos ({pendingCount + preparingCount + readyCount})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            <Clock className="h-3.5 w-3.5" /> Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
              filter === 'preparing'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            <Flame className="h-3.5 w-3.5" /> Em Preparo ({preparingCount})
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] flex items-center gap-1.5 ${
              filter === 'ready'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Prontos ({readyCount})
          </button>
        </div>
      </div>

      {/* Main Grid of Order Tickets */}
      {loading ? (
        <OrderCardSkeleton />
      ) : error ? (
        <ErrorState onRetry={loadOrders} />
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed py-20 text-center rounded-2xl">
          <CardContent className="space-y-3">
            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 inline-flex">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-bold text-lg">Cozinha sem pedidos nesta fila!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Quando novos pratos forem solicitados pelos clientes ou garçons, eles aparecerão aqui
              instantaneamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            let itemsList: KitchenOrderItem[] = []
            if (Array.isArray(order.items)) {
              itemsList = order.items
            } else if (typeof order.items === 'string') {
              try {
                itemsList = JSON.parse(order.items || '[]')
              } catch {
                itemsList = []
              }
            }

            const isPending = order.status === 'pending'
            const isPreparing = order.status === 'preparing'
            const isReady = order.status === 'ready'
            const elapsed = getElapsedTime(order.created)

            return (
              <Card
                key={order.id}
                className={`rounded-2xl border-2 transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                  isPending
                    ? 'border-amber-400/80 bg-card'
                    : isPreparing
                      ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/10'
                      : 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10'
                }`}
              >
                <div>
                  {/* Card Header with Table & Time */}
                  <CardHeader className="p-4 pb-3 border-b bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-xl text-foreground">
                            Mesa {order.table_number || '01'}
                          </h3>
                          <StatusBadge status={order.status} />
                        </div>
                        {order.customer_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cliente:{' '}
                            <strong className="text-foreground">{order.customer_name}</strong>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono font-bold bg-background border px-2.5 py-1 rounded-xl shadow-xs">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        <span>{elapsed}</span>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Items list */}
                  <CardContent className="p-4 space-y-2.5">
                    {itemsList.map((it: any, i: number) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-foreground">
                            {it.quantity || 1}x {it.name}
                          </span>
                        </div>
                        {it.notes && (
                          <p className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded text-[11px]">
                            ⚠️ Obs: {it.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 pt-0 border-t mt-2 pt-3">
                  {isPending && (
                    <Button
                      onClick={() => handleStatusChange(order, 'preparing')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl gap-2 min-h-[44px]"
                    >
                      <Flame className="h-4 w-4" /> Iniciar Preparo
                    </Button>
                  )}

                  {isPreparing && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange(order, 'pending')}
                        className="h-11 rounded-xl text-xs font-bold"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleStatusChange(order, 'ready')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl gap-2 min-h-[44px]"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Pronto para Servir
                      </Button>
                    </div>
                  )}

                  {isReady && (
                    <Button
                      onClick={() => handleStatusChange(order, 'delivered')}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 rounded-xl gap-2 min-h-[44px]"
                    >
                      <Check className="h-4 w-4" /> Entregue à Mesa
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
