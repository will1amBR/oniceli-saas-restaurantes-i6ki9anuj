import React, { useState, useEffect } from 'react'
import {
  Wine,
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
  GlassWater,
  FileSpreadsheet,
  Kanban as KanbanIcon,
  LayoutGrid,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  User,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getBarOrders,
  updateBarOrderStatus,
  type BarOrder,
  type BarOrderItem,
} from '@/services/bar-orders'
import { getInventory, type InventoryItem } from '@/services/inventory'
import { getSales, type SaleRecord } from '@/services/sales'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { OrderCardSkeleton } from '@/components/loading-skeletons'
import { ErrorState } from '@/components/error-state'
import { StatusBadge } from '@/components/status-badge'
import { DoseReportPanel } from '@/components/dose-report-panel'

// Bar Kanban Card Component optimized for touch tablets
interface BarKanbanCardProps {
  order: BarOrder
  onStatusChange: (
    order: BarOrder,
    newStatus: 'pending' | 'preparing' | 'ready' | 'delivered',
  ) => Promise<void>
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, orderId: string) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  isDragging?: boolean
}

function BarKanbanCard({
  order,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: BarKanbanCardProps) {
  let itemsList: BarOrderItem[] = []
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
  const isDelivered = order.status === 'delivered'

  const getElapsedTime = (createdStr: string) => {
    if (!createdStr) return '0 min'
    const created = new Date(createdStr)
    const diffMin = Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000))
    return `${diffMin} min`
  }

  const getElapsedNumber = (createdStr: string) => {
    if (!createdStr) return 0
    const created = new Date(createdStr)
    return Math.max(0, Math.floor((Date.now() - created.getTime()) / 60000))
  }

  const elapsedMins = getElapsedNumber(order.created)
  const isDelayed = (isPending || isPreparing) && elapsedMins >= 15
  const isWarning = (isPending || isPreparing) && elapsedMins >= 8 && !isDelayed

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, order.id)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl border-2 transition-all select-none shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing bg-card flex flex-col justify-between ${
        isDragging ? 'opacity-40 scale-95 ring-4 ring-indigo-500' : 'opacity-100'
      } ${
        isPending
          ? 'border-indigo-400/90 bg-indigo-500/[0.04] dark:bg-indigo-950/20 ring-1 ring-indigo-400/30'
          : isPreparing
            ? 'border-blue-500/90 bg-blue-500/[0.05] dark:bg-blue-950/25 ring-1 ring-blue-500/30'
            : isReady
              ? 'border-emerald-500/90 bg-emerald-500/[0.06] dark:bg-emerald-950/30 ring-1 ring-emerald-500/30'
              : 'border-border/80 bg-muted/30 opacity-80'
      }`}
    >
      <div>
        {/* Card Header with Table & Time */}
        <div className="p-3.5 sm:p-4 pb-3 border-b bg-muted/30 rounded-t-2xl flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              title="Toque ou arraste para mover"
              className="text-muted-foreground/50 hover:text-muted-foreground p-1 cursor-grab active:cursor-grabbing -ml-1 touch-none"
            >
              <GripVertical className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-lg sm:text-xl md:text-2xl text-foreground tracking-tight">
                  Mesa {order.table_number || '01'}
                </span>
                <StatusBadge
                  status={order.status}
                  showIcon={false}
                  className="text-[11px] font-bold px-2 py-0.5"
                />
              </div>
              {order.customer_name && (
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate max-w-[200px]">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{order.customer_name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Time Badge with Warning Color */}
          <div
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-mono font-black px-2.5 py-1 rounded-xl border shadow-xs shrink-0 ${
              isDelayed
                ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/30 animate-pulse'
                : isWarning
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-background border-border text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>{getElapsedTime(order.created)}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {itemsList.map((it: any, idx: number) => (
            <div
              key={idx}
              className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm space-y-1.5"
            >
              <div className="flex items-baseline justify-between font-bold text-foreground">
                <span className="text-sm sm:text-base leading-snug">
                  <span className="inline-block min-w-[28px] font-mono text-indigo-700 dark:text-indigo-400 mr-1.5 font-black text-base sm:text-lg">
                    {it.quantity || 1}x
                  </span>
                  {it.name}
                </span>
              </div>
              {it.notes && (
                <div className="text-xs sm:text-sm font-black text-rose-700 dark:text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                  <span className="shrink-0 text-base leading-none">⚠️</span>
                  <span>Obs: {it.notes}</span>
                </div>
              )}
            </div>
          ))}

          {order.notes && (
            <div className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-2 rounded-xl">
              📝 Geral: {order.notes}
            </div>
          )}
        </div>
      </div>

      {/* Touch-First Large Action Buttons (56px min height for Tablet taps) */}
      <div className="p-3.5 sm:p-4 pt-2 border-t mt-1 bg-muted/20 rounded-b-2xl">
        {isPending && (
          <div className="flex gap-2">
            <Button
              onClick={() => onStatusChange(order, 'preparing')}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-all"
            >
              <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>INICIAR COQUETELARIA</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 ml-auto" />
            </Button>
          </div>
        )}

        {isPreparing && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => onStatusChange(order, 'pending')}
              title="Voltar para Pendente"
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl font-black shrink-0 min-h-[56px] min-w-[56px] border-2 hover:bg-muted active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => onStatusChange(order, 'ready')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-all"
            >
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>BEBIDA PRONTA</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 ml-auto" />
            </Button>
          </div>
        )}

        {isReady && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => onStatusChange(order, 'preparing')}
              title="Voltar para Preparo"
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl font-black shrink-0 min-h-[56px] min-w-[56px] border-2 hover:bg-muted active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => onStatusChange(order, 'delivered')}
              className="flex-1 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-all"
            >
              <Check className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>ENTREGUE À MESA</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 ml-auto" />
            </Button>
          </div>
        )}

        {isDelivered && (
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground px-1 py-1">
            <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Entregue à Mesa
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(order, 'ready')}
              className="h-11 px-4 text-xs sm:text-sm font-bold rounded-xl min-h-[44px]"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reabrir
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface BarKanbanColumnProps {
  id: 'pending' | 'preparing' | 'ready' | 'delivered'
  title: string
  icon: React.ComponentType<{ className?: string }>
  badgeColor: string
  headerBg: string
  borderAccent: string
  orders: BarOrder[]
  onStatusChange: (
    order: BarOrder,
    newStatus: 'pending' | 'preparing' | 'ready' | 'delivered',
  ) => Promise<void>
  onDropOrder: (
    orderId: string,
    targetStatus: 'pending' | 'preparing' | 'ready' | 'delivered',
  ) => void
  draggedOrderId: string | null
  setDraggedOrderId: (id: string | null) => void
}

function BarKanbanColumn({
  id,
  title,
  icon: IconComp,
  badgeColor,
  headerBg,
  borderAccent,
  orders,
  onStatusChange,
  onDropOrder,
  draggedOrderId,
  setDraggedOrderId,
}: BarKanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const orderId = e.dataTransfer.getData('text/plain') || draggedOrderId
    if (orderId) {
      onDropOrder(orderId, id)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl border-2 transition-all bg-muted/20 min-w-[290px] sm:min-w-[320px] md:min-w-[340px] flex-1 max-w-full snap-center shrink-0 lg:shrink ${borderAccent} ${
        isDragOver ? 'ring-4 ring-primary ring-offset-2 bg-primary/10 scale-[1.01]' : ''
      }`}
    >
      {/* Column Header — Sticky on Scroll */}
      <div
        className={`sticky top-0 z-10 p-3.5 sm:p-4 border-b rounded-t-2xl backdrop-blur-md flex items-center justify-between shadow-2xs ${headerBg}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-background shadow-xs text-foreground">
            <IconComp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base md:text-lg tracking-tight text-foreground">
              {title}
            </h3>
          </div>
        </div>

        <Badge
          className={`font-mono font-black text-xs sm:text-sm px-3 py-1 rounded-full shadow-2xs ${badgeColor}`}
        >
          {orders.length}
        </Badge>
      </div>

      {/* Orders Scrollable List */}
      <div className="p-3 sm:p-3.5 space-y-3.5 flex-1 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[300px] touch-pan-y">
        {orders.length === 0 ? (
          <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground border-2 border-dashed border-border/60 rounded-xl bg-background/50">
            <Layers className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-bold text-foreground">Nenhum pedido</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {id === 'pending'
                ? 'Aguardando novas bebidas do salão'
                : id === 'preparing'
                  ? 'Nenhum coquetel em preparo'
                  : id === 'ready'
                    ? 'Nenhuma bebida para servir'
                    : 'Histórico de drinks entregues'}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <BarKanbanCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              isDragging={draggedOrderId === order.id}
              onDragStart={(e, orderId) => {
                setDraggedOrderId(orderId)
                e.dataTransfer.setData('text/plain', orderId)
              }}
              onDragEnd={() => setDraggedOrderId(null)}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function BarDashboard() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<BarOrder[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban')
  const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null)
  const [showDoseReport, setShowDoseReport] = useState(false)

  const loadOrders = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true)
      setError(false)
      const [data, inv, sData, mData] = await Promise.all([
        getBarOrders(),
        getInventory().catch(() => []),
        getSales().catch(() => []),
        getMenuItems().catch(() => []),
      ])
      setOrders(data)
      setInventory(inv)
      setSales(sData)
      setMenuItems(mData)
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

  useRealtime('bar_orders', () => loadOrders())

  const handleStatusChange = async (
    order: BarOrder,
    newStatus: 'pending' | 'preparing' | 'ready' | 'delivered',
  ) => {
    try {
      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: newStatus, updated: new Date().toISOString() } : o,
        ),
      )

      await updateBarOrderStatus(order.id, newStatus)

      const statusLabels = {
        pending: 'PENDENTE (BAR)',
        preparing: 'EM COQUETELARIA',
        ready: 'BEBIDA PRONTA (Estoque Baixado)',
        delivered: 'ENTREGUE À MESA',
      }

      toast({
        title: 'Status do Bar atualizado!',
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
        title: 'Erro ao atualizar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
      loadOrders()
    }
  }

  const handleDropOrder = async (
    orderId: string,
    targetStatus: 'pending' | 'preparing' | 'ready' | 'delivered',
  ) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return
    if (order.status === targetStatus) return
    await handleStatusChange(order, targetStatus)
  }

  // Filtered orders with search query
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

  // Buckets
  const pendingOrders = filteredOrders.filter((o) => o.status === 'pending')
  const preparingOrders = filteredOrders.filter((o) => o.status === 'preparing')
  const readyOrders = filteredOrders.filter((o) => o.status === 'ready')
  const deliveredOrders = filteredOrders.filter((o) => o.status === 'delivered')

  const totalActive = pendingOrders.length + preparingOrders.length

  return (
    <div className="space-y-6 pb-20">
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
              <Wine className="h-7 w-7 text-indigo-600" />
              Bar & Doses (KDS)
            </h1>
            <Badge className="bg-indigo-600 text-white text-[10px] font-bold">Kanban KDS Bar</Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Triagem ágil de bebidas, coquetelaria em tempo real e controle de doses.
          </p>
        </div>

        {/* Header Controls (Search & View Switch & Dose Report & Refresh) */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar mesa ou drink..."
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
            onClick={() => setShowDoseReport(!showDoseReport)}
            className="text-xs font-bold gap-1.5 h-10 rounded-xl shrink-0"
          >
            <GlassWater className="h-4 w-4 text-indigo-600" />
            <span className="hidden sm:inline">
              {showDoseReport ? 'Ocultar Doses' : 'Doses (ML)'}
            </span>
          </Button>

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

      {/* Bar Metrics Mini Banner */}
      <div className="rounded-2xl border p-3.5 sm:p-4 bg-card shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Wine className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fila de Bebidas:
              </span>
              <Badge
                variant="outline"
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  totalActive > 5
                    ? 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                }`}
              >
                {totalActive > 5 ? 'Alta Demanda' : 'Fluxo Normal'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingOrders.length} pendentes • {preparingOrders.length} preparando •{' '}
              {readyOrders.length} prontos para servir
            </p>
          </div>
        </div>

        {readyOrders.length > 0 && (
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-black animate-pulse">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              {readyOrders.length} {readyOrders.length === 1 ? 'bebida pronta' : 'bebidas prontas'}{' '}
              para a mesa!
            </span>
          </div>
        )}
      </div>

      {/* Dose report expander */}
      {showDoseReport && (
        <DoseReportPanel
          inventory={inventory}
          sales={sales}
          menuItems={menuItems}
          onRefresh={() => loadOrders()}
        />
      )}

      {/* Main Content: Kanban or Grid */}
      {loading ? (
        <OrderCardSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => loadOrders()} />
      ) : filteredOrders.length === 0 ? (
        <Card className="border-dashed py-20 text-center rounded-2xl bg-card">
          <CardContent className="space-y-3">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 inline-flex">
              <Wine className="h-12 w-12" />
            </div>
            <h3 className="font-black text-xl">Nenhum drink ou bebida na fila!</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Novas bebidas solicitadas pelas comandas entrarão imediatamente neste painel.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        /* Tablet & Desktop Optimized Bar Kanban Board with 4 Columns and Touch-Snap */
        <div className="w-full overflow-x-auto pb-6 pt-1 snap-x snap-mandatory touch-pan-x no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0">
          <div className="flex gap-4 min-w-full lg:min-w-0 items-start">
            {/* Column 1: Pendentes / Bar */}
            <BarKanbanColumn
              id="pending"
              title="Pendentes (Bar)"
              icon={Clock}
              badgeColor="bg-indigo-600 text-white"
              headerBg="bg-indigo-500/10 dark:bg-indigo-950/30"
              borderAccent="border-indigo-400/80 dark:border-indigo-500/40"
              orders={pendingOrders}
              onStatusChange={handleStatusChange}
              onDropOrder={handleDropOrder}
              draggedOrderId={draggedOrderId}
              setDraggedOrderId={setDraggedOrderId}
            />

            {/* Column 2: Em Coquetelaria */}
            <BarKanbanColumn
              id="preparing"
              title="Em Coquetelaria"
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

            {/* Column 3: Bebidas Prontas */}
            <BarKanbanColumn
              id="ready"
              title="Bebidas Prontas"
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
            <BarKanbanColumn
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
            <BarKanbanCard key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
