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
  Layers,
  LayoutGrid,
  Kanban as KanbanIcon,
  Archive,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getKitchenOrders,
  updateKitchenOrderStatus,
  type KitchenOrder,
  type KitchenOrderStatus,
} from '@/services/kitchen-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { OrderCardSkeleton } from '@/components/loading-skeletons'
import { ErrorState } from '@/components/error-state'
import { KitchenMetricsBar } from '@/components/kitchen-metrics-bar'
import { KitchenKanbanColumn, KitchenKanbanCard } from '@/components/kitchen-kanban'
import { useKitchenMetrics } from '@/hooks/use-kitchen-metrics'

export default function KitchenDashboard() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban')

  const loadOrders = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true)
      setError(false)
      const data = await getKitchenOrders()
      setOrders(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      if (isManualRefresh) setRefreshing(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  useRealtime('kitchen_orders', () => loadOrders())

  const metrics = useKitchenMetrics(orders)

  const handleStatusChange = async (order: KitchenOrder, newStatus: KitchenOrderStatus) => {
    try {
      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: newStatus, updated: new Date().toISOString() } : o,
        ),
      )

      await updateKitchenOrderStatus(order.id, newStatus)

      const statusLabels: Record<KitchenOrderStatus, string> = {
        pending: 'PENDENTE (TRIAGEM)',
        preparing: 'EM COZIMENTO',
        ready: 'PRONTO PARA SERVIR (Estoque Baixado)',
        delivered: 'ENTREGUE À MESA',
        cancelled: 'CANCELADO',
      }

      toast({
        title: 'Status atualizado!',
        description: `Mesa ${order.table_number || '01'} ➔ ${statusLabels[newStatus]}`,
        className:
          newStatus === 'ready'
            ? 'bg-emerald-600 text-white font-bold'
            : newStatus === 'preparing'
              ? 'bg-blue-600 text-white font-bold'
              : 'bg-foreground text-background font-bold',
      })
      loadOrders()
    } catch (err) {
      toast({
        title: 'Erro ao atualizar pedido',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
      loadOrders()
    }
  }

  const handleDropOrder = async (orderId: string, targetStatus: KitchenOrderStatus) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    if (order.status === targetStatus) return
    await handleStatusChange(order, targetStatus)
  }

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const matchTable = (o.table_number || '').toLowerCase().includes(q)
    const matchCustomer = (o.customer_name || '').toLowerCase().includes(q)
    let matchItem = false
    try {
      const itemsList = Array.isArray(o.items) ? o.items : JSON.parse(o.items || '[]')
      matchItem = itemsList.some((it: any) => (it.name || '').toLowerCase().includes(q))
    } catch {
      /* ignore */
    }
    return matchTable || matchCustomer || matchItem
  })

  // Kanban Column Buckets (Fixed Order: Pendentes (Triagem) -> Em Cozimento -> Prontos -> Entregues)
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending')
  const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing')
  const readyOrders = filteredOrders.filter((o) => o.status === 'ready')
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered')

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <ChefHat className="h-7 w-7 text-amber-600" />
              KDS Cozinha & Triagem
            </h1>
            <Badge className="bg-amber-600 text-white text-[10px] font-bold">Kanban KDS</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Triagem ágil de pedidos, esteira de cozimento e métricas de tempo em tempo real.
          </p>
        </div>

        {/* Header Controls (Search & View Switch & Refresh) */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mesa ou prato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center border rounded-xl p-1 bg-muted/40 shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              title="Visualização Kanban de Triagem"
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-background shadow-xs text-foreground font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Visualização em Grade"
              className={`p-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-background shadow-xs text-foreground font-black'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="h-10 w-10 rounded-xl shrink-0"
            title="Atualizar Pedidos"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Real-time Kitchen Metrics Bar & Traffic Light */}
      <KitchenMetricsBar metrics={metrics} />

      {/* Main Content: Kanban or Grid */}
      {loading ? (
        <OrderCardSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => loadOrders()} />
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed py-20 text-center rounded-2xl">
          <CardContent className="space-y-3">
            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 inline-flex">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="font-bold text-lg">Cozinha sem pedidos no momento!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Quando novos pratos forem lançados pelos garçons ou clientes, eles entrarão na coluna
              de Triagem instantaneamente.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board with 4 Columns */
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar items-start">
          {/* Column 1: Pendentes / Triagem */}
          <KitchenKanbanColumn
            id="pending"
            title="Pendentes (Triagem)"
            icon={Clock}
            badgeColor="bg-amber-600 text-white"
            headerBg="bg-amber-500/10 dark:bg-amber-950/20"
            borderAccent="border-amber-400/80 dark:border-amber-500/40"
            orders={pendingOrders}
            onStatusChange={handleStatusChange}
            onDropOrder={handleDropOrder}
            draggedOrderId={draggedOrderId}
            setDraggedOrderId={setDraggedOrderId}
          />

          {/* Column 2: Em Cozimento */}
          <KitchenKanbanColumn
            id="preparing"
            title="Em Cozimento"
            icon={Flame}
            badgeColor="bg-blue-600 text-white"
            headerBg="bg-blue-500/10 dark:bg-blue-950/20"
            borderAccent="border-blue-500/80 dark:border-blue-500/40"
            orders={preparingOrders}
            onStatusChange={handleStatusChange}
            onDropOrder={handleDropOrder}
            draggedOrderId={draggedOrderId}
            setDraggedOrderId={setDraggedOrderId}
          />

          {/* Column 3: Prontos */}
          <KitchenKanbanColumn
            id="ready"
            title="Prontos para Servir"
            icon={CheckCircle2}
            badgeColor="bg-emerald-600 text-white"
            headerBg="bg-emerald-500/10 dark:bg-emerald-950/20"
            borderAccent="border-emerald-500/80 dark:border-emerald-500/40"
            orders={readyOrders}
            onStatusChange={handleStatusChange}
            onDropOrder={handleDropOrder}
            draggedOrderId={draggedOrderId}
            setDraggedOrderId={setDraggedOrderId}
          />

          {/* Column 4: Entregues */}
          <KitchenKanbanColumn
            id="delivered"
            title="Entregues à Mesa"
            icon={Check}
            badgeColor="bg-slate-700 text-white"
            headerBg="bg-slate-500/10 dark:bg-slate-950/20"
            borderAccent="border-slate-300 dark:border-slate-800"
            orders={deliveredOrders}
            onStatusChange={handleStatusChange}
            onDropOrder={handleDropOrder}
            draggedOrderId={draggedOrderId}
            setDraggedOrderId={setDraggedOrderId}
          />
        </div>
      ) : (
        /* Grid View Alternative */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <KitchenKanbanCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
