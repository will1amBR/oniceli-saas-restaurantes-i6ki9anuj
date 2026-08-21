import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  Send,
  Search,
  CheckCircle2,
  Clock,
  Wine,
  ChefHat,
  Bell,
  Sparkles,
  ReceiptText,
  Volume2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  createBarOrder,
  getBarOrders,
  type BarOrder,
  type BarOrderItem,
} from '@/services/bar-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function WaiterDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()

  // Destination mode: kitchen vs bar
  const [destination, setDestination] = useState<'kitchen' | 'bar'>('kitchen')

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recentKitchenOrders, setRecentKitchenOrders] = useState<KitchenOrder[]>([])
  const [recentBarOrders, setRecentBarOrders] = useState<BarOrder[]>([])
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

  // Store previous statuses to detect real-time status transitions and alert the waiter
  const prevKitchenStatusRef = useRef<Record<string, string>>({})
  const prevBarStatusRef = useRef<Record<string, string>>({})
  const isInitialLoadRef = useRef(true)

  // Sound effect generator for real-time notifications
  const playNotificationSound = (type: 'ready' | 'preparing') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (type === 'ready') {
        // High upbeat dual chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15) // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.4)
      } else {
        // Soft double beep for preparing
        osc.frequency.setValueAtTime(440, ctx.currentTime) // A4
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.25)
      }
    } catch {
      /* ignore audio errors */
    }
  }

  // Resolve restaurant ID
  const restaurantId = user?.restaurant_id || (user?.role === 'restaurant' ? user.id : '')

  const loadData = useCallback(async () => {
    try {
      const [items, kOrders, bOrders] = await Promise.all([
        getMenuItems(restaurantId || undefined),
        getKitchenOrders(restaurantId || undefined),
        getBarOrders(restaurantId || undefined),
      ])
      setMenuItems(items.filter((i) => i.active !== false))

      // Check transitions for kitchen orders
      if (!isInitialLoadRef.current) {
        kOrders.forEach((order) => {
          const prevStatus = prevKitchenStatusRef.current[order.id]
          if (prevStatus && prevStatus !== order.status) {
            if (order.status === 'ready') {
              playNotificationSound('ready')
              toast({
                title: '🍽️ Prato Pronto para Retirar!',
                description: `Mesa ${order.table_number}: O pedido da cozinha foi finalizado e está pronto para servir.`,
                className: 'bg-emerald-600 text-white font-bold border-none shadow-xl',
                duration: 6000,
              })
            } else if (order.status === 'preparing') {
              playNotificationSound('preparing')
              toast({
                title: '👨‍🍳 Cozinha iniciou o preparo',
                description: `Mesa ${order.table_number}: A cozinha começou a preparar o pedido.`,
                className: 'bg-blue-600 text-white font-medium border-none shadow-md',
                duration: 4000,
              })
            }
          }
        })

        // Check transitions for bar orders
        bOrders.forEach((order) => {
          const prevStatus = prevBarStatusRef.current[order.id]
          if (prevStatus && prevStatus !== order.status) {
            if (order.status === 'ready') {
              playNotificationSound('ready')
              toast({
                title: '🍸 Drink Pronto no Balcão!',
                description: `Mesa ${order.table_number}: O pedido do bar está pronto para retirar.`,
                className: 'bg-indigo-600 text-white font-bold border-none shadow-xl',
                duration: 6000,
              })
            } else if (order.status === 'preparing') {
              playNotificationSound('preparing')
              toast({
                title: '🍹 Barman preparando bebidas',
                description: `Mesa ${order.table_number}: O bartender iniciou o preparo dos drinks.`,
                className: 'bg-purple-600 text-white font-medium border-none shadow-md',
                duration: 4000,
              })
            }
          }
        })
      }

      // Update refs
      const newKitchenStatus: Record<string, string> = {}
      kOrders.forEach((o) => (newKitchenStatus[o.id] = o.status))
      prevKitchenStatusRef.current = newKitchenStatus

      const newBarStatus: Record<string, string> = {}
      bOrders.forEach((o) => (newBarStatus[o.id] = o.status))
      prevBarStatusRef.current = newBarStatus

      isInitialLoadRef.current = false
      setRecentKitchenOrders(kOrders.slice(0, 15))
      setRecentBarOrders(bOrders.slice(0, 15))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [restaurantId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Realtime subscriptions
  useRealtime('kitchen_orders', () => loadData())
  useRealtime('bar_orders', () => loadData())
  useRealtime('menu_items', () => loadData())

  // Categories helper: If in 'bar' mode, only show beverage-related categories
  const isBeverageCategory = (catName: string = '') => {
    const c = catName.toLowerCase()
    return (
      c.includes('bebid') ||
      c.includes('drink') ||
      c.includes('coquet') ||
      c.includes('dose') ||
      c.includes('alco') ||
      c.includes('álco') ||
      c.includes('suco') ||
      c.includes('soft') ||
      c.includes('smoothie') ||
      c.includes('bar') ||
      c.includes('vinho') ||
      c.includes('cerveja')
    )
  }

  const destinationFilteredItems = useMemo(() => {
    if (destination === 'bar') {
      return menuItems.filter((item) => isBeverageCategory(item.category))
    }
    // Kitchen mode: show food or all except strictly pure alcoholic doses/cocktails if separated
    return menuItems
  }, [menuItems, destination])

  const categories = useMemo(() => {
    const set = new Set<string>()
    destinationFilteredItems.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['all', ...Array.from(set)]
  }, [destinationFilteredItems])

  // Reset category if selected category is not in destination categories
  useEffect(() => {
    if (selectedCategory !== 'all' && !categories.includes(selectedCategory)) {
      setSelectedCategory('all')
    }
  }, [categories, selectedCategory])

  const filteredItems = useMemo(() => {
    return destinationFilteredItems.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCat && matchesSearch
    })
  }, [destinationFilteredItems, selectedCategory, searchQuery])

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

  const handleSendOrder = async () => {
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
        description: `Selecione ao menos um item do cardápio para enviar ao ${destination === 'bar' ? 'Bar' : 'Cozinha'}.`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const formattedItems = orderItems.map((o) => ({
        menu_item_id: o.item.id,
        name: o.item.name,
        price: o.item.price || 0,
        quantity: o.quantity,
        notes: o.notes || '',
      }))

      if (destination === 'bar') {
        await createBarOrder({
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
          title: '🍹 Pedido Enviado para o BAR!',
          description: `Mesa ${tableNumber} · ${orderItems.length} bebidas enviadas para o display do Barman.`,
          className: 'bg-indigo-600 text-white font-bold',
        })
      } else {
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
          title: '🍽️ Pedido Enviado para a COZINHA!',
          description: `Mesa ${tableNumber} · ${orderItems.length} pratos enviados para o display da Cozinha.`,
          className: 'bg-emerald-600 text-white font-bold',
        })
      }

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

  // Combined orders sorted for the live status panel
  const allRecentOrders = useMemo(() => {
    const kList = recentKitchenOrders.map((o) => ({ ...o, orderType: 'kitchen' as const }))
    const bList = recentBarOrders.map((o) => ({ ...o, orderType: 'bar' as const }))
    return [...kList, ...bList].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    )
  }, [recentKitchenOrders, recentBarOrders])

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
            className="bg-blue-50 text-blue-700 border-blue-400 gap-1 animate-pulse font-semibold"
          >
            <Utensils className="h-3 w-3" /> Em Preparo
          </Badge>
        )
      case 'ready':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1.5 shadow-sm animate-bounce font-bold">
            <Bell className="h-3.5 w-3.5" /> Pronto para retirar!
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
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-700">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Comandas do Garçom</h1>
              <p className="text-sm text-muted-foreground">
                Garçom: <strong className="text-foreground">{user?.name || user?.email}</strong> ·
                Avisos sonoros e visuais em tempo real
              </p>
            </div>
          </div>
        </div>

        {/* Cozinha / Bar Destination Selector Header */}
        <div className="flex items-center p-1 bg-muted rounded-xl border">
          <Button
            size="sm"
            variant={destination === 'kitchen' ? 'default' : 'ghost'}
            onClick={() => setDestination('kitchen')}
            className={`gap-1.5 h-8 text-xs font-bold rounded-lg ${
              destination === 'kitchen' ? 'bg-emerald-600 text-white shadow-sm' : ''
            }`}
          >
            <ChefHat className="h-4 w-4" /> Cozinha
          </Button>
          <Button
            size="sm"
            variant={destination === 'bar' ? 'default' : 'ghost'}
            onClick={() => setDestination('bar')}
            className={`gap-1.5 h-8 text-xs font-bold rounded-lg ${
              destination === 'bar' ? 'bg-indigo-600 text-white shadow-sm' : ''
            }`}
          >
            <Wine className="h-4 w-4" /> Bar (Drinks)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Menu Items Selection (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {destination === 'bar' ? (
                      <>
                        <Wine className="h-5 w-5 text-indigo-600" />
                        Cardápio do Bar & Bebidas
                      </>
                    ) : (
                      <>
                        <ChefHat className="h-5 w-5 text-emerald-600" />
                        Cardápio da Cozinha & Pratos
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {destination === 'bar'
                      ? 'Exibindo coquetéis, doses e bebidas. Clique para adicionar à comanda do Bar.'
                      : 'Toque ou clique em um prato para adicionar à comanda da Cozinha.'}
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className={
                    destination === 'bar'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  }
                >
                  Modo {destination === 'bar' ? 'Bar' : 'Cozinha'}
                </Badge>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      destination === 'bar'
                        ? 'Buscar drink, caipirinha, whisky, dose...'
                        : 'Buscar prato, entrada, sobremesa...'
                    }
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
                      {destination === 'bar' ? (
                        <Wine className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      ) : (
                        <Utensils className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      )}
                      <p className="text-sm font-medium">Nenhum item encontrado nesta seção</p>
                      <p className="text-xs text-muted-foreground">
                        Tente alterar a busca ou trocar entre Cozinha e Bar.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
                      {filteredItems.map((item) => {
                        const inOrder = orderItems.find((o) => o.item.id === item.id)
                        const isBar = destination === 'bar'

                        return (
                          <div
                            key={item.id}
                            onClick={() => addItemToOrder(item)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between select-none ${
                              inOrder
                                ? isBar
                                  ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/20 shadow-sm'
                                  : 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40'
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
                                <Badge
                                  className={`text-white text-xs h-5 px-1.5 shrink-0 ${
                                    isBar
                                      ? 'bg-indigo-600 hover:bg-indigo-600'
                                      : 'bg-emerald-600 hover:bg-emerald-600'
                                  }`}
                                >
                                  {inOrder.quantity}x
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span
                                className={`font-mono font-bold text-sm ${
                                  isBar
                                    ? 'text-indigo-700 dark:text-indigo-400'
                                    : 'text-emerald-700 dark:text-emerald-400'
                                }`}
                              >
                                R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                              </span>
                              <Button
                                size="sm"
                                variant={inOrder ? 'default' : 'outline'}
                                className={`h-7 px-2.5 text-xs gap-1 ${
                                  inOrder
                                    ? isBar
                                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : ''
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
          <Card
            className={`border-2 shadow-md transition-all ${
              destination === 'bar' ? 'border-indigo-500/50' : 'border-emerald-500/50'
            }`}
          >
            <CardHeader
              className={`border-b pb-3 ${
                destination === 'bar'
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/30'
                  : 'bg-emerald-50/60 dark:bg-emerald-950/30'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle
                    className={`text-lg flex items-center gap-2 ${
                      destination === 'bar'
                        ? 'text-indigo-950 dark:text-indigo-100'
                        : 'text-emerald-900 dark:text-emerald-100'
                    }`}
                  >
                    {destination === 'bar' ? (
                      <>
                        <Wine className="h-5 w-5 text-indigo-600" /> Comanda para o BAR
                      </>
                    ) : (
                      <>
                        <ReceiptText className="h-5 w-5 text-emerald-600" /> Comanda para COZINHA
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {destination === 'bar'
                      ? 'Bebidas serão enviadas para o display do Bar.'
                      : 'Pratos serão enviados para o display da Cozinha.'}
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
                    {destination === 'bar' ? (
                      <Wine className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    ) : (
                      <Utensils className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    )}
                    <p className="text-sm">Nenhum item selecionado</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Selecione itens no cardápio ao lado para montar a comanda.
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
                          placeholder={
                            destination === 'bar'
                              ? 'Obs do Drink (ex: pouco gelo, sem açúcar, limão à parte)'
                              : 'Obs do Prato (ex: sem cebola, ponto da carne)'
                          }
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
                  Observações Gerais da Comanda
                </Label>
                <Textarea
                  id="order-notes"
                  placeholder="Ex: Entregar com rapidez, cliente comemorando aniversário..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="text-xs"
                />
              </div>

              {/* Big Action Button */}
              {destination === 'bar' ? (
                <Button
                  onClick={handleSendOrder}
                  disabled={submitting || orderItems.length === 0 || !tableNumber.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-base shadow-lg shadow-indigo-600/20 gap-2 transition-all"
                >
                  <Wine className="h-5 w-5" />
                  {submitting ? 'Enviando...' : 'ENVIAR PARA O BAR'}
                </Button>
              ) : (
                <Button
                  onClick={handleSendOrder}
                  disabled={submitting || orderItems.length === 0 || !tableNumber.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-base shadow-lg shadow-emerald-600/20 gap-2 transition-all"
                >
                  <Send className="h-5 w-5" />
                  {submitting ? 'Enviando...' : 'ENVIAR PARA A COZINHA'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Realtime Status Display for Waiter with Alert highlights */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4 text-purple-600 animate-pulse" />
                  Status dos Pedidos (Tempo Real)
                </span>
                <Badge variant="secondary" className="text-xs font-normal">
                  Cozinha & Bar
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allRecentOrders.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum pedido enviado ainda hoje.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {allRecentOrders.map((ord) => {
                    let parsedItems: { quantity: number; name: string }[] = []
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
                    const isReady = ord.status === 'ready'
                    const isPreparing = ord.status === 'preparing'
                    const isBar = ord.orderType === 'bar'

                    return (
                      <div
                        key={ord.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                          isReady
                            ? 'bg-emerald-100/90 dark:bg-emerald-950/50 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                            : isPreparing
                              ? isBar
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-300'
                                : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300'
                              : 'bg-muted/20 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-bold ${
                                isBar
                                  ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              }`}
                            >
                              {isBar ? 'BAR' : 'COZINHA'}
                            </Badge>
                            <span className="font-bold text-foreground">
                              Mesa {ord.table_number}
                            </span>
                            <span className="text-muted-foreground">· {timeStr}</span>
                            {ord.customer_name && (
                              <span className="text-muted-foreground truncate max-w-[90px]">
                                ({ord.customer_name})
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground mt-1 truncate max-w-[220px]">
                            {parsedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                          {isReady && (
                            <p className="text-emerald-700 dark:text-emerald-300 font-bold mt-1 flex items-center gap-1">
                              <Bell className="h-3 w-3 animate-bounce" />
                              Pronto para retirar no balcão!
                            </p>
                          )}
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
