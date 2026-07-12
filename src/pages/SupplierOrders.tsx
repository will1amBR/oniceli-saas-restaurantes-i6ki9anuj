import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { ClipboardList, Loader2, Package, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getSuppliers } from '@/services/suppliers'
import { getOrdersForSupplier, updateOrderStatus, type Order } from '@/services/orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-500 hover:bg-amber-600 text-white' },
  processing: { label: 'Em Processamento', className: 'bg-blue-500 hover:bg-blue-600 text-white' },
  shipped: { label: 'Enviado', className: 'bg-cyan-500 hover:bg-cyan-600 text-white' },
  delivered: { label: 'Entregue', className: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500 hover:bg-red-600 text-white' },
}

export default function SupplierOrders() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const suppliers = await getSuppliers()
      const mySupplier = suppliers.find((s) => s.user_id === user.id)
      if (mySupplier) {
        setOrders(await getOrdersForSupplier(mySupplier.id))
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('orders', () => loadData())

  if (!user) return null
  if (user.role !== 'supplier') return <Navigate to="/dashboard" replace />

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus(orderId, status)
      toast({ title: 'Status atualizado!' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const getOrderItems = (order: Order) => {
    try {
      return JSON.parse(order.items || '[]')
    } catch {
      return []
    }
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
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Pedidos Recebidos</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe e atualize o status dos pedidos dos restaurantes.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum pedido recebido ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending
            const items = getOrderItems(order)
            const restaurantName = order.expand?.restaurant_id?.name || 'Restaurante'
            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-emerald-600" />
                        {restaurantName}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
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
                      </CardDescription>
                    </div>
                    <Badge className={cn(config.className)}>{config.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    {items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm border-b pb-1 last:border-0"
                      >
                        <span>
                          {item.name} × {item.quantity} {item.unit}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          R$ {(item.quantity * item.price).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Atualizar status:</span>
                    <Select
                      value={order.status}
                      onValueChange={(v) => handleStatusChange(order.id, v)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Em Processamento</SelectItem>
                        <SelectItem value="shipped">Enviado</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
