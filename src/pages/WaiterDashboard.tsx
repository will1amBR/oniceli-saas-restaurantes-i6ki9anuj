import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Send,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  ReceiptText,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import {
  createKitchenOrder,
  getKitchenOrders,
  type KitchenOrder,
  type KitchenOrderItem,
} from '@/services/kitchen-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function WaiterDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recentOrders, setRecentOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Order state
  const [tableNumber, setTableNumber] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [orderItems, setOrderItems] = useState<
    { item: MenuItem; quantity: number; notes?: string }[]
  >([])

  // Resolve restaurant ID
  const restaurantId = user?.restaurant_id || (user?.role === 'restaurant' ? user.id : '')

  const loadData = useCallback(async () => {
    try {
      const [items, orders] = await Promise.all([
        getMenuItems(restaurantId || undefined),
        getKitchenOrders(restaurantId || undefined),
      ])
      setMenuItems(items.filter((i) => i.active !== false))
      setRecentOrders(orders.slice(0, 15))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('kitchen_orders', () => loadData())
  useRealtime('menu_items', () => loadData())

  const categories = useMemo(() => {
    const set = new Set<string>()
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['all', ...Array.from(set)]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCat && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery])

  const addItemToOrder = (item: MenuItem) => {
    setOrderItems((prev) => {
      const existing = prev.find((o) => o.item.id === item.id)
      if (existing) {
        return prev.map((o) => (o.item.id === item.id ? { ...o, quantity: o.quantity + 1 } : o))
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setOrderItems((prev) => {
      return prev
        .map((o) => {
          if (o.item.id === itemId) {
            const newQty = o.quantity + delta
            return newQty > 0 ? { ...o, quantity: newQty } : null
          }
          return o
        })
        .filter(Boolean) as { item: MenuItem; quantity: number; notes?: string }[]
    })
  }

  const removeItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((o) => o.item.id !== itemId))
  }

  const updateItemNotes = (itemId: string, noteText: string) => {
    setOrderItems((prev) => prev.map((o) => (o.item.id === itemId ? { ...o, notes: noteText } : o)))
  }

  const totalAmount = useMemo(() => {
    return orderItems.reduce((acc, curr) => acc + (curr.item.price || 0) * curr.quantity, 0)
  }, [orderItems])

  const handleSendToKitchen = async () => {
    if (!tableNumber.trim()) {
      toast({
        title: 'Mesa/Comanda obrigatória',
        description: 'Por favor, informe o número da mesa ou da comanda.',
        variant: 'destructive',
      })
      return
    }

    if (orderItems.length === 0) {
      toast({
        title: 'Pedido vazio',
        description: 'Selecione ao menos um item do cardápio para enviar.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const formattedItems: KitchenOrderItem[] = orderItems.map((o) => ({
        menu_item_id: o.item.id,
        name: o.item.name,
        price: o.item.price || 0,
        quantity: o.quantity,
        notes: o.notes || '',
      }))

      await createKitchenOrder({
        restaurant_id: restaurantId,
        waiter_id: user?.id,
        table_number: tableNumber.trim(),
        customer_name: customerName.trim() || undefined,
        items: JSON.stringify(formattedItems),
        status: 'pending',
        total_amount: totalAmount,
        notes: notes.trim() || undefined,
        stock_deducted: false,
      })

      toast({
        title: 'Pedido enviado para a Cozinha!',
        description: `Mesa ${tableNumber} · ${orderItems.length} itens enviados com sucesso.`,
      })

      // Reset form
      setTableNumber('')
      setCustomerName('')
      setNotes('')
      setOrderItems([])
      loadData()
    } catch (err) {
      toast({
        title: 'Erro ao enviar pedido',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1">
            <Clock className="h-3 w-3" /> Pendente
          </Badge>
        )
      case 'preparing':
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300 gap-1 animate-pulse"
          >
            <Utensils className="h-3 w-3" /> Em Preparo
          </Badge>
        )
      case 'ready':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" /> Pronto p/ Entrega
          </Badge>
        )
      case 'delivered':
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-700">
            Entregue
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Comandas & Pedidos</h1>
              <p className="text-sm text-muted-foreground">
                Garçom: <strong className="text-foreground">{user?.name || user?.email}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Items Selection (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Cardápio do Restaurante</CardTitle>
              <CardDescription>
                Toque ou clique em um prato para adicionar à comanda.
              </CardDescription>
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar prato, bebida ou ingrediente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Category tabs */}
              <Tabs
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                className="w-full space-y-4"
              >
                <div className="overflow-x-auto pb-1">
                  <TabsList className="h-9 inline-flex w-auto p-1">
                    {categories.map((cat) => (
                      <TabsTrigger key={cat} value={cat} className="text-xs px-3 py-1">
                        {cat === 'all' ? 'Todos' : cat}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value={selectedCategory} className="mt-0">
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Carregando cardápio...
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-lg">
                      <Utensils className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Nenhum prato encontrado</p>
                      <p className="text-xs text-muted-foreground">
                        Tente alterar o filtro ou categoria.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                      {filteredItems.map((item) => {
                        const inOrder = orderItems.find((o) => o.item.id === item.id)
                        return (
                          <div
                            key={item.id}
                            onClick={() => addItemToOrder(item)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${
                              inOrder
                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="font-semibold text-sm leading-tight text-foreground block">
                                  {item.name}
                                </span>
                                {item.category && (
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              {inOrder && (
                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs h-5 px-1.5 shrink-0">
                                  {inOrder.quantity}x
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                              </span>
                              <Button
                                size="sm"
                                variant={inOrder ? 'default' : 'outline'}
                                className={`h-7 px-2.5 text-xs gap-1 ${
                                  inOrder ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addItemToOrder(item)
                                }}
                              >
                                <Plus className="h-3 w-3" /> Adicionar
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Assembly & Action (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-2 border-emerald-500/40 shadow-md">
            <CardHeader className="bg-emerald-50/60 dark:bg-emerald-950/30 border-b pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
                    <ReceiptText className="h-5 w-5 text-emerald-600" /> Nova Comanda
                  </CardTitle>
                  <CardDescription>
                    Monte o pedido e envie diretamente para a cozinha.
                  </CardDescription>
                </div>
                {orderItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOrderItems([])}
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Table / Customer inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="table-num" className="text-xs font-semibold">
                    Mesa / Comanda *
                  </Label>
                  <Input
                    id="table-num"
                    placeholder="Ex: 05, Mesa 12, Balcão"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="font-bold text-sm min-h-[42px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cust-name" className="text-xs">
                    Cliente (Opcional)
                  </Label>
                  <Input
                    id="cust-name"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="text-sm min-h-[42px]"
                  />
                </div>
              </div>

              {/* Items in order */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Itens Selecionados ({orderItems.reduce((a, b) => a + b.quantity, 0)})
                  </Label>
                  <span className="text-xs font-mono font-bold text-foreground">
                    Subtotal: R$ {totalAmount.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {orderItems.length === 0 ? (
                  <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
                    <Utensils className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum item selecionado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione pratos no cardápio ao lado para montar a comanda.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {orderItems.map((entry) => (
                      <div
                        key={entry.item.id}
                        className="p-2.5 rounded-lg border bg-background space-y-2 text-sm"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{entry.item.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              R$ {(entry.item.price || 0).toFixed(2).replace('.', ',')} cada
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQuantity(entry.item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-mono font-bold text-sm w-6 text-center">
                              {entry.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-full"
                              onClick={() => updateQuantity(entry.item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 ml-1"
                              onClick={() => removeItem(entry.item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Optional notes per item */}
                        <Input
                          placeholder="Obs (ex: sem cebola, ponto da carne...)"
                          value={entry.notes || ''}
                          onChange={(e) => updateItemNotes(entry.item.id, e.target.value)}
                          className="h-7 text-xs bg-muted/40"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* General Order Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="order-notes" className="text-xs">
                  Observações Gerais do Pedido
                </Label>
                <Textarea
                  id="order-notes"
                  placeholder="Ex: Entregar bebidas primeiro, cliente com pressa..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Big Action Button */}
              <Button
                onClick={handleSendToKitchen}
                disabled={submitting || orderItems.length === 0 || !tableNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-base shadow-lg shadow-emerald-600/20 gap-2 transition-all"
              >
                <Send className="h-5 w-5" />
                {submitting ? 'Enviando...' : 'ENVIAR PARA COZINHA'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders Status for Waiter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Últimos Pedidos Enviados</span>
                <Badge variant="secondary" className="text-xs font-normal">
                  Atualização em tempo real
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum pedido enviado ainda hoje.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {recentOrders.map((ord) => {
                    let parsedItems: KitchenOrderItem[] = []
                    try {
                      parsedItems =
                        typeof ord.items === 'string' ? JSON.parse(ord.items) : ord.items
                    } catch {
                      parsedItems = []
                    }
                    const timeStr = new Date(ord.created).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div
                        key={ord.id}
                        className="p-2.5 rounded-lg border bg-muted/20 text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">
                              Mesa {ord.table_number}
                            </span>
                            <span className="text-muted-foreground">· {timeStr}</span>
                            {ord.customer_name && (
                              <span className="text-muted-foreground truncate max-w-[100px]">
                                ({ord.customer_name})
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-0.5 truncate max-w-[220px]">
                            {parsedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                        </div>
                        <div className="shrink-0">{getStatusBadge(ord.status)}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
