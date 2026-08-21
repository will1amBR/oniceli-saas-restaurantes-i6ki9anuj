import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Wine,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  PackageCheck,
  Check,
  GlassWater,
  Flame,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getBarOrders,
  updateBarOrderStatus,
  type BarOrder,
  type BarOrderItem,
  type BarOrderStatus,
} from '@/services/bar-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function BarDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [orders, setOrders] = useState<BarOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')

  const restaurantId = user?.restaurant_id || (user?.role === 'restaurant' ? user.id : '')

  const loadData = useCallback(async () => {
    try {
      const data = await getBarOrders(restaurantId || undefined)
      setOrders(data)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscription to bar_orders
  useRealtime('bar_orders', () => {
    loadData()
  })

  // Format Elapsed time
  const getElapsedTime = (createdStr: string) => {
    try {
      const created = new Date(createdStr).getTime()
      const now = Date.now()
      const diffMinutes = Math.floor((now - created) / 60000)
      if (diffMinutes < 1) return 'Agora mesmo'
      if (diffMinutes === 1) return 'Há 1 min'
      if (diffMinutes < 60) return `Há ${diffMinutes} min`
      const diffHours = Math.floor(diffMinutes / 60)
      return `Há ${diffHours}h ${diffMinutes % 60}m`
    } catch {
      return ''
    }
  }

  const handleStatusChange = async (order: BarOrder, nextStatus: BarOrderStatus) => {
    setUpdatingId(order.id)
    try {
      await updateBarOrderStatus(order.id, nextStatus)
      if (nextStatus === 'ready') {
        toast({
          title: 'Drink Pronto no Balcão!',
          description: `Mesa/Balcão ${order.table_number} marcado como pronto. Baixa de doses em ML efetuada com sucesso!`,
        })
      } else if (nextStatus === 'preparing') {
        toast({
          title: 'Preparo de Bebidas Iniciado',
          description: `Mesa/Balcão ${order.table_number} agora está Em Preparo pelo Bartender.`,
        })
      }
      loadData()
    } catch (err) {
      toast({
        title: 'Erro ao atualizar pedido do bar',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const parseOrderItems = (items: string | BarOrderItem[]): BarOrderItem[] => {
    if (!items) return []
    if (typeof items === 'string') {
      try {
        return JSON.parse(items)
      } catch {
        return []
      }
    }
    return items
  }

  // Filtered orders
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders])
  const preparingOrders = useMemo(() => orders.filter((o) => o.status === 'preparing'), [orders])
  const readyOrders = useMemo(() => orders.filter((o) => o.status === 'ready'), [orders])
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === 'delivered'), [orders])

  const displayedOrders = useMemo(() => {
    if (activeTab === 'pending') return pendingOrders
    if (activeTab === 'preparing') return preparingOrders
    if (activeTab === 'ready') return readyOrders
    return orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled')
  }, [activeTab, orders, pendingOrders, preparingOrders, readyOrders])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
              <Wine className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Painel do Bar (KDS Drinks)
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Display de Coquetéis & Bebidas · Baixa por Dose (ml) em Tempo Real
              </p>
            </div>
          </div>
        </div>

        {/* Counters summary */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="px-3 py-1 bg-amber-50 text-amber-800 border-amber-300 font-semibold text-sm"
          >
            {pendingOrders.length} Pendentes
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1 bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold text-sm"
          >
            {preparingOrders.length} Em Preparo
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1 bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-sm"
          >
            {readyOrders.length} Prontos
          </Badge>
        </div>
      </div>

      {/* Main Tabs / Filter */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <TabsList className="grid grid-cols-4 max-w-md">
          <TabsTrigger value="all">
            Todos Ativos ({pendingOrders.length + preparingOrders.length + readyOrders.length})
          </TabsTrigger>
          <TabsTrigger value="pending">Pendentes ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="preparing">Em Preparo ({preparingOrders.length})</TabsTrigger>
          <TabsTrigger value="ready">Prontos ({readyOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">
              Carregando comandas de bebidas do bar...
            </div>
          ) : displayedOrders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 mb-3">
                  <GlassWater className="h-10 w-10" />
                </div>
                <p className="text-lg font-semibold">Nenhum drink ou bebida nesta fila</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Quando o garçom selecionar a aba <strong>Bar</strong> e enviar coquetéis, eles
                  aparecerão instantaneamente aqui.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayedOrders.map((order) => {
                const items = parseOrderItems(order.items)
                const isPending = order.status === 'pending'
                const isPreparing = order.status === 'preparing'
                const isReady = order.status === 'ready'
                const isUpdating = updatingId === order.id

                const elapsed = getElapsedTime(order.created)
                const timeOnly = new Date(order.created).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })

                return (
                  <Card
                    key={order.id}
                    className={`flex flex-col border-2 transition-all duration-200 shadow-sm ${
                      isPending
                        ? 'border-amber-400 bg-amber-50/15 dark:bg-amber-950/15 shadow-amber-100 dark:shadow-none'
                        : isPreparing
                          ? 'border-indigo-400 bg-indigo-50/15 dark:bg-indigo-950/15 shadow-indigo-100 dark:shadow-none'
                          : 'border-emerald-500 bg-emerald-50/15 dark:bg-emerald-950/15'
                    }`}
                  >
                    {/* Header with Table Number & Time */}
                    <CardHeader className="pb-3 border-b bg-muted/30">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
                              <Wine className="h-4 w-4 text-indigo-600 inline" />
                              MESA {order.table_number}
                            </span>
                            {order.customer_name && (
                              <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]">
                                · {order.customer_name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{timeOnly}</span>
                            <span>•</span>
                            <span className="font-semibold text-indigo-700 dark:text-indigo-400">
                              {elapsed}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPending && (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase px-2.5 py-0.5">
                              Pendente
                            </Badge>
                          )}
                          {isPreparing && (
                            <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase px-2.5 py-0.5 animate-pulse">
                              Em Preparo
                            </Badge>
                          )}
                          {isReady && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-2.5 py-0.5">
                              Pronto p/ Retirar
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {/* Order Items Body */}
                    <CardContent className="flex-1 pt-4 space-y-3">
                      <div className="space-y-2">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg border bg-background/90 flex items-start justify-between gap-3"
                          >
                            <div className="flex items-start gap-2 min-w-0">
                              <span className="flex items-center justify-center h-6 w-6 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-sm shrink-0">
                                {item.quantity}x
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-sm leading-snug text-foreground">
                                  {item.name}
                                </p>
                                {item.notes && (
                                  <p className="text-xs text-indigo-700 dark:text-indigo-400 font-medium mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    Obs: {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* General Notes */}
                      {order.notes && (
                        <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 text-xs text-indigo-900 dark:text-indigo-200">
                          <strong className="block mb-0.5">Observação do Garçom:</strong>
                          {order.notes}
                        </div>
                      )}

                      {/* Stock dose deduction feedback badge */}
                      {order.stock_deducted && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                          <PackageCheck className="h-4 w-4" />
                          <span>Doses (ml) baixadas no estoque</span>
                        </div>
                      )}
                    </CardContent>

                    {/* Footer Actions */}
                    <CardFooter className="pt-3 border-t bg-muted/20 gap-2">
                      {isPending && (
                        <Button
                          onClick={() => handleStatusChange(order, 'preparing')}
                          disabled={isUpdating}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 gap-2 shadow-sm"
                        >
                          <Play className="h-4 w-4" />
                          INICIAR PREPARO
                        </Button>
                      )}

                      {isPreparing && (
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(order, 'pending')}
                            disabled={isUpdating}
                            className="text-xs px-2.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Voltar
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(order, 'ready')}
                            disabled={isUpdating}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 gap-2 shadow-md shadow-emerald-600/20"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            CONCLUIR (PRONTO)
                          </Button>
                        </div>
                      )}

                      {isReady && (
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(order, 'preparing')}
                            disabled={isUpdating}
                            className="text-xs px-2.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" /> Voltar
                          </Button>
                          <Button
                            onClick={() => handleStatusChange(order, 'delivered')}
                            disabled={isUpdating}
                            variant="secondary"
                            className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold h-11 gap-2"
                          >
                            <Check className="h-4 w-4" />
                            ENTREGUE AO CLIENTE
                          </Button>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
