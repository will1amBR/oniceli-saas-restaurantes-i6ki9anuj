import { useState, useEffect, useCallback } from 'react'
import { Navigate, Link } from 'react-router-dom'
import {
  ShoppingBag,
  MessageCircle,
  Calendar,
  DollarSign,
  Truck,
  Package,
  Loader2,
  Users,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getOrdersForRestaurant, type Order, type OrderItem } from '@/services/orders'
import { buildReorderMessage, buildWhatsAppUrl } from '@/lib/whatsapp'
import { CollectivePurchasesPanel } from '@/components/collective-purchases-panel'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  processing: { label: 'Processando', className: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Enviado', className: 'bg-cyan-100 text-cyan-800' },
  delivered: { label: 'Entregue', className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
}

function parseItems(order: Order): OrderItem[] {
  try {
    return JSON.parse(order.items || '[]')
  } catch {
    return []
  }
}

export default function Purchases() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [supplierFilter, setSupplierFilter] = useState('all')

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await getOrdersForRestaurant(user.id)
      setOrders(data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('orders', () => loadData())

  if (!user) return null
  if (user.role === 'supplier') return <Navigate to="/supplier/dashboard" replace />

  const suppliers = Array.from(
    new Map(
      orders
        .filter((o) => o.expand?.supplier_id)
        .map((o) => [o.expand!.supplier_id!.id, o.expand!.supplier_id!]),
    ).values(),
  )

  const filteredOrders =
    supplierFilter === 'all'
      ? orders
      : orders.filter((o) => o.expand?.supplier_id?.id === supplierFilter)

  const upcomingOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'processing' || o.status === 'shipped',
  )

  const handleReorder = (order: Order) => {
    const supplier = order.expand?.supplier_id
    if (!supplier) return
    const items = parseItems(order)
    const message = buildReorderMessage(supplier.name, items)
    const url = buildWhatsAppUrl(supplier.phone || '', message)
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Compras, Lotes & Fornecedores
            </h1>
            <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
              2026
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Participe de compras coletivas com desconto em escala e gerencie pedidos com
            fornecedores.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link to="/fornecedores">
              <ShoppingBag className="mr-2 h-4 w-4" /> Novo Pedido Avulso
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="collective" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="collective" className="gap-2 font-semibold">
            <Users className="h-4 w-4 text-emerald-600" />
            Compras Coletivas (Lotes)
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 font-semibold">
            <Layers className="h-4 w-4" />
            Histórico de Pedidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collective" className="space-y-6">
          <CollectivePurchasesPanel />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b">
                <div>
                  <CardTitle>Histórico de Pedidos</CardTitle>
                  <CardDescription>Filtre por fornecedor e reordene facilmente.</CardDescription>
                </div>
                {suppliers.length > 0 && (
                  <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue placeholder="Filtrar fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os fornecedores</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {orders.length === 0
                        ? 'Nenhum pedido realizado ainda.'
                        : 'Nenhum pedido para este fornecedor.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const config = statusConfig[order.status] || statusConfig.pending
                      const items = parseItems(order)
                      const supplierName = order.expand?.supplier_id?.name || 'Fornecedor'
                      return (
                        <div
                          key={order.id}
                          className="flex flex-col gap-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-emerald-600" />
                                <span className="font-medium">{supplierName}</span>
                                <Badge
                                  className={cn(
                                    'inline-flex items-center justify-center whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-full leading-none border-transparent',
                                    config.className,
                                  )}
                                >
                                  {config.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(order.created).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  R${' '}
                                  {(order.total_amount || 0).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 shrink-0"
                              onClick={() => handleReorder(order)}
                            >
                              <MessageCircle className="mr-1.5 h-4 w-4" />
                              Reordenar
                            </Button>
                          </div>
                          {items.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {items.map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs font-normal">
                                  {item.quantity} {item.unit} {item.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-inner">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Truck className="mr-2 h-5 w-5 text-emerald-600" />
                  Próximas Entregas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma entrega pendente.
                  </p>
                ) : (
                  upcomingOrders.map((order) => {
                    const items = parseItems(order)
                    const supplierName = order.expand?.supplier_id?.name || 'Fornecedor'
                    const config = statusConfig[order.status] || statusConfig.pending
                    return (
                      <div
                        key={order.id}
                        className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{supplierName}</span>
                          <Badge
                            className={cn(
                              'inline-flex items-center justify-center whitespace-nowrap text-xs font-medium px-2.5 py-1 rounded-full leading-none border-transparent',
                              config.className,
                            )}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {items.map((i) => i.name).join(', ')}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
