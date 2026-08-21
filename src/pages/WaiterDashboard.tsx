import { useState, useEffect } from 'react'
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Send,
  Sparkles,
  ShoppingBag,
  Wine,
  ChefHat,
  Search,
  CheckCircle2,
  AlertCircle,
  Table as TableIcon,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import { createKitchenOrder, getKitchenOrders, type KitchenOrder } from '@/services/kitchen-orders'
import { createBarOrder, getBarOrders, type BarOrder } from '@/services/bar-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { StatusBadge } from '@/components/status-badge'
import { ErrorState } from '@/components/error-state'
import { TableSkeleton } from '@/components/loading-skeletons'

export default function WaiterDashboard() {
  const { toast } = useToast()
  const [tableNumber, setTableNumber] = useState('01')
  const [customerName, setCustomerName] = useState('')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<{ item: MenuItem; quantity: number; notes: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Live active orders for tables
  const [activeKitchenOrders, setActiveKitchenOrders] = useState<KitchenOrder[]>([])
  const [activeBarOrders, setActiveBarOrders] = useState<BarOrder[]>([])

  const loadData = async () => {
    try {
      setLoading(true)
      const [items, kOrders, bOrders] = await Promise.all([
        getMenuItems(),
        getKitchenOrders(),
        getBarOrders(),
      ])
      setMenuItems(items.filter((i) => i.active !== false))
      setActiveKitchenOrders(kOrders.filter((o) => o.status !== 'delivered'))
      setActiveBarOrders(bOrders.filter((o) => o.status !== 'delivered'))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('menu_items', () => loadData())
  useRealtime('kitchen_orders', () => loadData())
  useRealtime('bar_orders', () => loadData())

  const isBeverage = (item: MenuItem) => {
    const cat = (item.category || '').toLowerCase()
    const name = item.name.toLowerCase()
    return (
      cat.includes('suco') ||
      cat.includes('smoothie') ||
      cat.includes('bebida') ||
      cat.includes('drink') ||
      cat.includes('bar') ||
      cat.includes('café') ||
      name.includes('suco') ||
      name.includes('smoothie') ||
      name.includes('café') ||
      name.includes('drink')
    )
  }

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.item.id === item.id)
      if (idx > -1) {
        const next = [...prev]
        next[idx].quantity += 1
        return next
      }
      return [...prev, { item, quantity: 1, notes: '' }]
    })
    toast({
      title: 'Item adicionado',
      description: `${item.name} incluído na mesa ${tableNumber}`,
      duration: 1500,
    })
  }

  const updateCartQty = (id: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((e) => {
            if (e.item.id === id) {
              const nextQty = e.quantity + delta
              return nextQty > 0 ? { ...e, quantity: nextQty } : null
            }
            return e
          })
          .filter(Boolean) as any,
    )
  }

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((e) => e.item.id !== id))
  }

  const handleSendOrder = async () => {
    if (!tableNumber.trim()) {
      toast({
        title: 'Mesa obrigatória',
        description: 'Informe o número da mesa.',
        variant: 'destructive',
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: 'Comanda vazia',
        description: 'Selecione pratos ou bebidas para lançar o pedido.',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const kItems = cart.filter((c) => !isBeverage(c.item))
      const bItems = cart.filter((c) => isBeverage(c.item))

      if (kItems.length > 0) {
        const payload = kItems.map((k) => ({
          menu_item_id: k.item.id,
          name: k.item.name,
          price: k.item.price || 0,
          quantity: k.quantity,
          notes: k.notes,
        }))
        const total = kItems.reduce((acc, k) => acc + (k.item.price || 0) * k.quantity, 0)
        await createKitchenOrder({
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || undefined,
          items: JSON.stringify(payload),
          status: 'pending',
          total_amount: total,
          stock_deducted: false,
        })
      }

      if (bItems.length > 0) {
        const payload = bItems.map((b) => ({
          menu_item_id: b.item.id,
          name: b.item.name,
          price: b.item.price || 0,
          quantity: b.quantity,
          notes: b.notes,
        }))
        const total = bItems.reduce((acc, b) => acc + (b.item.price || 0) * b.quantity, 0)
        await createBarOrder({
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || undefined,
          items: JSON.stringify(payload),
          status: 'pending',
          total_amount: total,
          stock_deducted: false,
        })
      }

      toast({
        title: 'Pedido lançado!',
        description: `Mesa ${tableNumber} enviada para os displays com sucesso.`,
        className: 'bg-emerald-600 text-white font-bold',
      })
      setCart([])
      setCustomerName('')
    } catch (err) {
      toast({
        title: 'Erro ao lançar pedido',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredItems = menuItems.filter((i) => {
    const matchCat = categoryFilter === 'all' || i.category === categoryFilter
    const matchSearch =
      !searchQuery ||
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCat && matchSearch
  })

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.item.price || 0) * curr.quantity, 0)
  const cartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)

  // Tables quick buttons
  const quickTables = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'Balcão']

  return (
    <div className="space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-border/60 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            Comanda do Garçom
            <Badge className="bg-purple-600 text-white text-[10px] font-bold">Touch</Badge>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Lançamento rápido e acompanhamento das mesas do salão em tempo real.
          </p>
        </div>

        {/* Quick Table Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          <span className="text-xs font-bold text-muted-foreground mr-1 shrink-0">Mesa:</span>
          {quickTables.map((t) => (
            <button
              key={t}
              onClick={() => setTableNumber(t)}
              className={`min-w-[44px] h-11 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
                tableNumber === t
                  ? 'bg-purple-600 text-white shadow-md scale-105'
                  : 'bg-muted hover:bg-muted/80 text-foreground border'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Menu picker (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-purple-600" />
                  Itens do Cardápio
                </CardTitle>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar prato ou bebida..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              {/* Horizontal Category filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[36px] ${
                    categoryFilter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Todos
                </button>
                {Array.from(new Set(menuItems.map((i) => i.category).filter(Boolean))).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat as string)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap min-h-[36px] ${
                        categoryFilter === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ),
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {loading ? (
                <TableSkeleton rows={4} cols={3} />
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">
                  Nenhum item encontrado nesta categoria.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredItems.map((item) => {
                    const isDrink = isBeverage(item)
                    const inCart = cart.find((c) => c.item.id === item.id)

                    return (
                      <div
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none active:scale-[0.98] ${
                          inCart
                            ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm'
                            : 'border-border/80 hover:border-purple-400 bg-card'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 ${
                                  isDrink
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {isDrink ? 'BAR' : 'COZINHA'}
                              </Badge>
                              <span className="font-bold text-sm truncate">{item.name}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.category || 'Geral'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                          <span className="font-mono font-black text-sm text-purple-700 dark:text-purple-300">
                            R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                          </span>

                          <Button
                            size="sm"
                            className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1 bg-purple-600 hover:bg-purple-700 text-white min-h-[36px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              addToCart(item)
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Adicionar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Current Active Tray (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <Card className="rounded-2xl border-2 border-purple-500/50 shadow-md bg-card flex flex-col">
            <CardHeader className="pb-3 border-b bg-purple-50/30 dark:bg-purple-950/20">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                  Comanda: Mesa {tableNumber}
                </CardTitle>
                <Badge variant="outline" className="text-xs font-mono font-bold bg-background">
                  {cartCount} {cartCount === 1 ? 'item' : 'itens'}
                </Badge>
              </div>

              {/* Customer Name Input */}
              <div className="pt-2">
                <Input
                  placeholder="Nome do cliente (opcional)..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9 text-xs rounded-xl bg-background"
                />
              </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 space-y-3 min-h-[260px] max-h-[380px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-xs space-y-2">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p>Toque nos pratos ou bebidas para montar a comanda.</p>
                </div>
              ) : (
                cart.map((entry) => (
                  <div
                    key={entry.item.id}
                    className="p-3 rounded-xl border bg-muted/20 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate text-foreground">{entry.item.name}</p>
                        <p className="font-mono text-muted-foreground">
                          R$ {(entry.item.price || 0).toFixed(2).replace('.', ',')} un
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-lg min-h-[32px] min-w-[32px]"
                          onClick={() => updateCartQty(entry.item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-mono font-bold w-6 text-center text-sm">
                          {entry.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-lg min-h-[32px] min-w-[32px]"
                          onClick={() => updateCartQty(entry.item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:text-red-700 min-h-[32px] min-w-[32px]"
                          onClick={() => removeCartItem(entry.item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <Input
                      placeholder="Obs do item (ex: sem cebola)..."
                      value={entry.notes}
                      onChange={(e) => {
                        const val = e.target.value
                        setCart((prev) =>
                          prev.map((c) => (c.item.id === entry.item.id ? { ...c, notes: val } : c)),
                        )
                      }}
                      className="h-7 text-[11px] rounded-lg bg-background"
                    />
                  </div>
                ))
              )}
            </CardContent>

            {/* Cart Footer Total & Launch Button */}
            <div className="p-4 border-t bg-muted/20 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Total Mesa
                </span>
                <span className="font-mono font-black text-xl text-purple-700 dark:text-purple-400">
                  R$ {cartTotal.toFixed(2).replace('.', ',')}
                </span>
              </div>

              <Button
                onClick={handleSendOrder}
                disabled={submitting || cart.length === 0}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold h-12 rounded-xl text-sm shadow-md gap-2 min-h-[46px]"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'ENVIANDO...' : 'ENVIAR PARA PREPARO'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
