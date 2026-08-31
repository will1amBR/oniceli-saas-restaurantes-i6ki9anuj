import React, { useState } from 'react'
import {
  Clock,
  Flame,
  CheckCircle2,
  Check,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  AlertCircle,
  Sparkles,
  User,
  Layers,
  Archive,
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import type { KitchenOrder, KitchenOrderItem, KitchenOrderStatus } from '@/services/kitchen-orders'

interface KitchenKanbanCardProps {
  order: KitchenOrder
  onStatusChange: (order: KitchenOrder, newStatus: KitchenOrderStatus) => Promise<void>
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, orderId: string) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  isDragging?: boolean
}

export function KitchenKanbanCard({
  order,
  onStatusChange,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: KitchenKanbanCardProps) {
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
  const isDelayed = (isPending || isPreparing) && elapsedMins >= 20
  const isWarning = (isPending || isPreparing) && elapsedMins >= 12 && !isDelayed

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, order.id)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl border-2 transition-all select-none shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing bg-card flex flex-col justify-between ${
        isDragging ? 'opacity-40 scale-95 ring-4 ring-amber-500' : 'opacity-100'
      } ${
        isPending
          ? 'border-amber-400/90 bg-amber-500/[0.04] dark:bg-amber-950/20 ring-1 ring-amber-400/30'
          : isPreparing
            ? 'border-blue-500/90 bg-blue-500/[0.05] dark:bg-blue-950/25 ring-1 ring-blue-500/30'
            : isReady
              ? 'border-emerald-500/90 bg-emerald-500/[0.06] dark:bg-emerald-950/30 ring-1 ring-emerald-500/30'
              : 'border-border/80 bg-muted/30 opacity-80'
      }`}
    >
      <div>
        {/* Card Header with Table & Time & Drag Handle (Optimized for Distance Readability) */}
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

          {/* Time Badge with Warning Color (Large font for tablet distance viewing) */}
          <div
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-mono font-black px-2.5 py-1 rounded-xl border shadow-xs shrink-0 ${
              isDelayed
                ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/30 animate-pulse'
                : isWarning
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-background border-border text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span>{getElapsedTime(order.created)}</span>
          </div>
        </div>

        {/* Order Items (Clear, large quantities and pratos for tablet screen) */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {itemsList.map((it: any, idx: number) => (
            <div
              key={idx}
              className="p-2.5 sm:p-3 rounded-xl bg-muted/40 border border-border/60 text-xs sm:text-sm space-y-1.5"
            >
              <div className="flex items-baseline justify-between font-bold text-foreground">
                <span className="text-sm sm:text-base leading-snug">
                  <span className="inline-block min-w-[28px] font-mono text-purple-700 dark:text-purple-400 mr-1.5 font-black text-base sm:text-lg">
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

      {/* Touch-First Large Action Buttons (56px-60px height for kitchen tablet taps) */}
      <div className="p-3.5 sm:p-4 pt-2 border-t mt-1 bg-muted/20 rounded-b-2xl">
        {isPending && (
          <div className="flex gap-2">
            <Button
              onClick={() => onStatusChange(order, 'preparing')}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-all"
            >
              <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>INICIAR COZIMENTO</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 ml-auto" />
            </Button>
          </div>
        )}

        {isPreparing && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => onStatusChange(order, 'pending')}
              title="Voltar para Triagem"
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl font-black shrink-0 min-h-[56px] min-w-[56px] border-2 hover:bg-muted active:scale-95"
            >
              <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => onStatusChange(order, 'ready')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-all"
            >
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
              <span>PRONTO / SERVIR</span>
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 ml-auto" />
            </Button>
          </div>
        )}

        {isReady && (
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={() => onStatusChange(order, 'preparing')}
              title="Voltar para Em Cozimento"
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

interface KanbanColumnProps {
  id: KitchenOrderStatus
  title: string
  icon: React.ComponentType<{ className?: string }>
  badgeColor: string
  headerBg: string
  borderAccent: string
  orders: KitchenOrder[]
  onStatusChange: (order: KitchenOrder, newStatus: KitchenOrderStatus) => Promise<void>
  onDropOrder: (orderId: string, targetStatus: KitchenOrderStatus) => void
  draggedOrderId: string | null
  setDraggedOrderId: (id: string | null) => void
}

export function KitchenKanbanColumn({
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
}: KanbanColumnProps) {
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
                ? 'Aguardando novos pratos da comanda'
                : id === 'preparing'
                  ? 'Nenhum prato em fogo neste momento'
                  : id === 'ready'
                    ? 'Nenhum prato aguardando garçom'
                    : 'Histórico de entregas do turno'}
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <KitchenKanbanCard
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
