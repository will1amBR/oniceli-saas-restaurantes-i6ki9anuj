import { useState, useEffect } from 'react'
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  Check,
  Search,
  LayoutGrid,
  Kanban as KanbanIcon,
  Maximize2,
  Minimize2,
  RefreshCw,
  ClipboardCheck,
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
import { DailyConsumptionClosing } from '@/components/daily-consumption-closing'

export default function KitchenDashboard() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [closingModalOpen, setClosingModalOpen] = useState(false)

  // Toggle fullscreen for dedicated kitchen tablet mounts
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {})
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {})
    }
  }

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

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

  // FIFO strict ordering: compare created timestamp ascending (oldest order first)
  const fifoSort = (a: KitchenOrder, b: KitchenOrder) => {
    const timeA = a.created ? new Date(a.created).getTime() : 0
    const timeB = b.created ? new Date(b.created).getTime() : 0
    return timeA - timeB
  }

  // Kanban Column Buckets (FIFO: mais antigo primeiro em todas as colunas)
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending').sort(fifoSort)
  const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing').sort(fifoSort)
  const readyOrders = filteredOrders.filter((o) => o.status === 'ready').sort(fifoSort)
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered').sort(fifoSort)

  return (
    <div className={`space-y-5 pb-20 ${isFullscreen ? 'p-3 bg-background min-h-screen' : ''}`}>
      {/* Top Header — Limpo, direto e sem distrações visuais */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 bg-card p-3.5 sm:p-4 rounded-2xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
            <ChefHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                KDS Cozinha
              </h1>
              <Badge className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5">
                Modo Tablet
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} pedido(s) ativo(s) · Toque nos botões para avançar o preparo
            </p>
          </div>
        </div>

        {/* Header Controls (Search & View Switch & Refresh & Modo Tela Cheia) */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mesa ou prato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 text-xs rounded-xl"
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

          {/* Botão Fechamento de Consumo do Dia */}
          <Button
            variant="outline"
            onClick={() => setClosingModalOpen(true)}
            className="h-11 px-3.5 rounded-xl shrink-0 font-extrabold text-xs gap-1.5 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 shadow-2xs"
            title="Registrar consumo e desvio de insumos do turno da cozinha"
          >
            <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Fechamento do Dia</span>
          </Button>

          {/* Botão de Tela Cheia para o Tablet da Cozinha */}
          <Button
            variant="outline"
            onClick={toggleFullscreen}
            className="h-11 px-3 rounded-xl shrink-0 font-bold text-xs gap-1.5"
            title={isFullscreen ? 'Sair da tela cheia' : 'Modo Tablet Tela Cheia'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-4 w-4" />
                <span className="hidden md:inline">Sair Tela Cheia</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                <span className="hidden md:inline">Tela Cheia</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="h-11 w-11 rounded-xl shrink-0"
            title="Atualizar Pedidos"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Real-time Kitchen Metrics Bar & Traffic Light */}
      <KitchenMetricsBar metrics={metrics} />

      {/* Banner Atalho de Fechamento de Consumo para Cozinheiros */}
      <div className="rounded-2xl border p-3 sm:p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
              Fim de Turno / Fechamento de Insumos da Cozinha
              <Badge className="bg-amber-600 text-white text-[9px] font-bold">Obrigatório</Badge>
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Valide os insumos teóricos baixados pelas receitas e informe desvios reais (queimas,
              erros ou perdas).
            </p>
          </div>
        </div>
        <Button
          onClick={() => setClosingModalOpen(true)}
          className="h-11 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs gap-1.5 shadow-sm active:scale-95 transition-transform"
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>Abrir Fechamento do Dia</span>
        </Button>
      </div>

      {/* Main Content: Kanban or Grid */}
      {loading ? (
        <OrderCardSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => loadOrders()} />
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed py-20 text-center rounded-2xl bg-card">
          <CardContent className="space-y-3">
            <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 inline-flex">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h3 className="font-black text-xl">Cozinha sem pedidos no momento!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Quando novos pratos forem lançados pelos garçons ou clientes, eles entrarão na coluna
              de Triagem instantaneamente.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Tablet & Desktop Optimized Kanban Board with 4 Columns and Touch-Snap */
        <div className="w-full overflow-x-auto pb-6 pt-1 snap-x snap-mandatory touch-pan-x no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="flex gap-4 min-w-full lg:min-w-0 items-start">
            {/* Column 1: Pendentes / Triagem */}
            <KitchenKanbanColumn
              id="pending"
              title="Pendentes (Triagem)"
              icon={Clock}
              badgeColor="bg-amber-600 text-white"
              headerBg="bg-amber-500/10 dark:bg-amber-950/30"
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
              headerBg="bg-blue-500/10 dark:bg-blue-950/30"
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
              headerBg="bg-emerald-500/10 dark:bg-emerald-950/30"
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
              headerBg="bg-slate-500/10 dark:bg-slate-950/30"
              borderAccent="border-slate-300 dark:border-slate-800"
              orders={deliveredOrders}
              onStatusChange={handleStatusChange}
              onDropOrder={handleDropOrder}
              draggedOrderId={draggedOrderId}
              setDraggedOrderId={setDraggedOrderId}
            />
          </div>
        </div>
      ) : (
        /* Grid View Alternative */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <KitchenKanbanCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}

      {/* Modal / Tela de Fechamento de Consumo Diário */}
      <DailyConsumptionClosing
        open={closingModalOpen}
        onOpenChange={setClosingModalOpen}
        onSuccess={() => {
          loadOrders()
        }}
      />
    </div>
  )
}
