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
      className={`group relative rounded-2xl border transition-all select-none shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing bg-card flex flex-col justify-between ${
        isDragging ? 'opacity-40 scale-95 ring-2 ring-purple-500' : 'opacity-100'
      } ${
        isPending
          ? 'border-amber-400/80 hover:border-amber-500 bg-amber-50/10 dark:bg-amber-950/10'
          : isPreparing
            ? 'border-blue-500/80 hover:border-blue-600 bg-blue-50/15 dark:bg-blue-950/15 ring-1 ring-blue-500/20'
            : isReady
              ? 'border-emerald-500/80 hover:border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-border bg-muted/20 opacity-80'
      }`}
    >
      <div>
        {/* Card Header with Table & Time & Drag Handle */}
        <div className="p-3.5 pb-2.5 border-b bg-muted/20 rounded-t-2xl flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              title="Arraste para mover de coluna"
              className="text-muted-foreground/40 hover:text-muted-foreground p-0.5 cursor-grab -ml-1"
            >
              <GripVertical className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-black text-base sm:text-lg text-foreground tracking-tight">
                  Mesa {order.table_number || '01'}
                </span>
                <StatusBadge
                  status={order.status}
                  showIcon={false}
                  className="text-[10px] px-1.5 py-0"
                />
              </div>
              {order.customer_name && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[150px]">
                  <User className="h-3 w-3 shrink-0" />
                  <span className="truncate">{order.customer_name}</span>
                </p>
              )}
            </div>
          </div>

          {/* Time Badge with Warning Color */}
          <div
            className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-lg border shrink-0 ${
              isDelayed
                ? 'bg-rose-500 text-white border-rose-600 shadow-xs animate-pulse'
                : isWarning
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-background border-border text-foreground'
            }`}
          >
            <Clock className="h-3 w-3 shrink-0" />
            <span>{getElapsedTime(order.created)}</span>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-3.5 space-y-2">
          {itemsList.map((it: any, idx: number) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-muted/30 border border-border/40 text-xs space-y-1"
            >
              <div className="flex items-center justify-between font-bold text-foreground">
                <span className="text-sm">
                  <span className="font-mono text-purple-700 dark:text-purple-400 mr-1 font-black">
                    {it.quantity || 1}x
                  </span>
                  {it.name}
                </span>
              </div>
              {it.notes && (
                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg">
                  ⚠️ Obs: {it.notes}
                </div>
              )}
            </div>
          ))}

          {order.notes && (
            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
              Comentário: {order.notes}
            </div>
          )}
        </div>
      </div>

      {/* Touch-Friendly Action Buttons */}
      <div className="p-3 pt-2 border-t mt-1 bg-muted/10 rounded-b-2xl">
        {isPending && (
          <div className="flex gap-2">
            <Button
              onClick={() => onStatusChange(order, 'preparing')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl text-xs gap-1.5 shadow-xs min-h-[44px]"
            >
              <Flame className="h-4 w-4" /> Iniciar Cozimento
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        )}

        {isPreparing && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onStatusChange(order, 'pending')}
              title="Voltar para Triagem"
              className="h-11 px-3 rounded-xl text-xs font-bold shrink-0 min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onStatusChange(order, 'ready')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl text-xs gap-1.5 shadow-xs min-h-[44px]"
            >
              <CheckCircle2 className="h-4 w-4" /> Pronto / Servir
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        )}

        {isReady && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onStatusChange(order, 'preparing')}
              title="Voltar para Em Cozimento"
              className="h-11 px-3 rounded-xl text-xs font-bold shrink-0 min-h-[44px] min-w-[44px]"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onStatusChange(order, 'delivered')}
              className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold h-11 rounded-xl text-xs gap-1.5 shadow-xs min-h-[44px]"
            >
              <Check className="h-4 w-4" /> Entregue à Mesa
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        )}

        {isDelivered && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 py-1">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Finalizado
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onStatusChange(order, 'ready')}
              className="h-8 text-[11px] text-muted-foreground hover:text-foreground font-semibold"
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reabrir
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
      className={`flex flex-col rounded-2xl border-2 transition-all bg-muted/20 min-w-[280px] sm:min-w-[300px] flex-1 max-w-full ${borderAccent} ${
        isDragOver ? 'ring-2 ring-primary ring-offset-2 bg-primary/5 scale-[1.01]' : ''
      }`}
    >
      {/* Column Header */}
      <div
        className={`p-3.5 sm:p-4 border-b rounded-t-2xl flex items-center justify-between ${headerBg}`}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-background shadow-xs">
            <IconComp className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
              {title}
            </h3>
          </div>
        </div>

        <Badge
          className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-full shadow-2xs ${badgeColor}`}
        >
          {orders.length}
        </Badge>
      </div>

      {/* Orders Scrollable List */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] min-h-[220px]">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
            <Layers className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-semibold">Nenhum pedido</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {id === 'pending'
                ? 'Aguardando novos pratos'
                : id === 'preparing'
                  ? 'Nenhum prato em fogo'
                  : id === 'ready'
                    ? 'Nenhum prato para entrega'
                    : 'Histórico de entregas'}
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
