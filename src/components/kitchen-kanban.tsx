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
  const [isUpdating, setIsUpdating] = useState(false)

  let rawItemsList: KitchenOrderItem[] = []
  if (Array.isArray(order.items)) {
    rawItemsList = order.items
  } else if (typeof order.items === 'string') {
    try {
      rawItemsList = JSON.parse(order.items || '[]')
    } catch {
      rawItemsList = []
    }
  }

  // Agrupamento visual de itens idênticos (mesmo item + mesma observação) para facilitar visualização rápida
  const groupedItems = React.useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; notes?: string }>()
    for (const it of rawItemsList) {
      const key = `${(it.name || '').trim().toLowerCase()}__${(it.notes || '').trim().toLowerCase()}`
      const existing = map.get(key)
      if (existing) {
        existing.quantity += Number(it.quantity || 1)
      } else {
        map.set(key, {
          name: it.name || 'Item sem nome',
          quantity: Number(it.quantity || 1),
          notes: it.notes ? String(it.notes).trim() : undefined,
        })
      }
    }
    return Array.from(map.values())
  }, [rawItemsList])

  const totalQuantity = groupedItems.reduce((acc, it) => acc + it.quantity, 0)

  const isPending = order.status === 'pending'
  const isPreparing = order.status === 'preparing'
  const isReady = order.status === 'ready'
  const isDelivered = order.status === 'delivered'

  const handleAction = async (newStatus: KitchenOrderStatus) => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      await onStatusChange(order, newStatus)
    } finally {
      setIsUpdating(false)
    }
  }

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

  // Detecta se tem alguma observação crítica/alergia
  const hasCriticalNotes = groupedItems.some((it) => {
    if (!it.notes) return false
    const n = it.notes.toLowerCase()
    return (
      n.includes('alerg') ||
      n.includes('sem glúten') ||
      n.includes('sem gluten') ||
      n.includes('lactose') ||
      n.includes('urgente') ||
      n.includes('atenção')
    )
  })

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, order.id)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl border-2 transition-all duration-150 select-none shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing bg-card flex flex-col justify-between ${
        isDragging ? 'opacity-40 scale-95 ring-4 ring-amber-500' : 'opacity-100'
      } ${isUpdating ? 'animate-pulse pointer-events-none opacity-80' : ''} ${
        isPending
          ? 'border-amber-400 bg-amber-500/[0.04] dark:bg-amber-950/25 ring-1 ring-amber-400/30'
          : isPreparing
            ? 'border-blue-500 bg-blue-500/[0.05] dark:bg-blue-950/30 ring-1 ring-blue-500/30'
            : isReady
              ? 'border-emerald-500 bg-emerald-500/[0.07] dark:bg-emerald-950/35 ring-1 ring-emerald-500/30'
              : 'border-border/80 bg-muted/30 opacity-80'
      }`}
    >
      <div>
        {/* Card Header Dominante: Número da Mesa como Elemento Mais Proeminente do Card */}
        <div
          className={`p-3.5 sm:p-4 pb-3 border-b rounded-t-2xl flex items-center justify-between gap-2 transition-colors ${
            isPending
              ? 'bg-amber-500/10 dark:bg-amber-950/40'
              : isPreparing
                ? 'bg-blue-500/10 dark:bg-blue-950/40'
                : isReady
                  ? 'bg-emerald-500/15 dark:bg-emerald-950/50'
                  : 'bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              title="Toque ou arraste para mover de coluna"
              className="text-muted-foreground/60 hover:text-foreground p-1 cursor-grab active:cursor-grabbing -ml-1 touch-none rounded-lg hover:bg-background/60"
            >
              <GripVertical className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              {/* Mesa Gigante e Marcante para visualização a 2 metros de distância */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-black text-2xl sm:text-3xl tracking-tight text-foreground drop-shadow-2xs">
                  MESA {order.table_number || '01'}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] font-bold px-1.5 py-0 bg-background/80"
                >
                  {totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'}
                </Badge>
              </div>

              {order.customer_name ? (
                <p className="text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                  <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                  <span className="truncate">{order.customer_name}</span>
                </p>
              ) : null}
            </div>
          </div>

          {/* Time Badge com Alerta de SLA em destaque */}
          <div
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-mono font-black px-2.5 py-1.5 rounded-xl border shadow-xs shrink-0 ${
              isDelayed
                ? 'bg-rose-500 text-white border-rose-600 shadow-rose-500/30 animate-pulse'
                : isWarning
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                  : 'bg-background border-border text-foreground'
            }`}
            title={`Tempo decorrido desde o envio: ${getElapsedTime(order.created)}`}
          >
            <Clock className="h-4 w-4 shrink-0" />
            <span>{getElapsedTime(order.created)}</span>
          </div>
        </div>

        {/* Alerta de Alergia / Observação Crítica no topo do corpo se houver */}
        {hasCriticalNotes && (
          <div className="mx-3 sm:mx-4 mt-3 p-2.5 rounded-xl bg-rose-600 text-white font-black text-xs flex items-center gap-2 shadow-sm animate-pulse">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="uppercase tracking-wider">Atenção Cozinha: Alergia / Obs Crítica</span>
          </div>
        )}

        {/* Order Items — Agrupados, claros e com quantidades dominantes */}
        <div className="p-3.5 sm:p-4 space-y-2.5">
          {groupedItems.map((it, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs sm:text-sm space-y-1.5 transition-all ${
                it.notes
                  ? 'bg-amber-500/[0.08] dark:bg-amber-950/30 border-amber-500/40'
                  : 'bg-muted/40 border-border/70'
              }`}
            >
              <div className="flex items-baseline justify-between font-bold text-foreground">
                <span className="text-sm sm:text-base leading-snug flex items-baseline">
                  {/* Quantidade grande para leitura rápida */}
                  <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-1.5 mr-2 rounded-lg bg-foreground text-background font-mono font-black text-sm sm:text-base shadow-2xs">
                    {it.quantity}x
                  </span>
                  <span className="font-extrabold text-foreground tracking-tight">{it.name}</span>
                </span>
              </div>

              {/* Observação / Alergia destacada com badge amarelo/vermelho */}
              {it.notes && (
                <div className="mt-1 text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 bg-amber-400/25 dark:bg-amber-400/20 border border-amber-500/50 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                  <span className="shrink-0 text-base leading-none">⚠️</span>
                  <span>{it.notes}</span>
                </div>
              )}
            </div>
          ))}

          {order.notes && (
            <div className="text-xs sm:text-sm font-semibold text-amber-900 dark:text-amber-200 bg-amber-500/20 border border-amber-500/40 px-3 py-2 rounded-xl flex items-start gap-1.5">
              <span className="shrink-0 text-base leading-none">📝</span>
              <span>Geral: {order.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Botões Touch de 56px-64px de Ação Rápida com Feedback Háptico/Visual */}
      <div className="p-3.5 sm:p-4 pt-2 border-t mt-1 bg-muted/20 rounded-b-2xl">
        {isPending && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('preparing')}
              disabled={isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-transform"
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
              onClick={() => handleAction('pending')}
              disabled={isUpdating}
              title="Voltar para Triagem"
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl font-black shrink-0 min-h-[56px] min-w-[56px] border-2 hover:bg-muted active:scale-95 transition-transform"
            >
              <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => handleAction('ready')}
              disabled={isUpdating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-transform"
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
              onClick={() => handleAction('preparing')}
              disabled={isUpdating}
              title="Voltar para Em Cozimento"
              className="h-14 sm:h-16 w-14 sm:w-16 rounded-xl font-black shrink-0 min-h-[56px] min-w-[56px] border-2 hover:bg-muted active:scale-95 transition-transform"
            >
              <ChevronLeft className="h-6 w-6 text-muted-foreground" />
            </Button>
            <Button
              onClick={() => handleAction('delivered')}
              disabled={isUpdating}
              className="flex-1 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-black h-14 sm:h-16 rounded-xl text-sm sm:text-base gap-2 shadow-md min-h-[56px] transition-transform"
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
              onClick={() => handleAction('ready')}
              disabled={isUpdating}
              className="h-11 px-4 text-xs sm:text-sm font-bold rounded-xl min-h-[44px] active:scale-95 transition-transform"
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
