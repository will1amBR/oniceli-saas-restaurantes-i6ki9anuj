import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Utensils,
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  ShoppingBag,
  ChefHat,
  Wine,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  Flame,
  Coffee,
  RotateCcw,
  Store,
  BadgePercent,
  Check,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import { createKitchenOrder, getKitchenOrders, type KitchenOrder } from '@/services/kitchen-orders'
import { createBarOrder, getBarOrders, type BarOrder } from '@/services/bar-orders'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

// Fallback high quality images for menu categories/items
const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  suco: 'https://img.usecurling.com/p/600/400?q=fresh%20juice%20smoothie',
  smoothie: 'https://img.usecurling.com/p/600/400?q=smoothie%20fruit',
  cafe: 'https://img.usecurling.com/p/600/400?q=espresso%20coffee',
  sobremesa: 'https://img.usecurling.com/p/600/400?q=dessert%20cake',
  salada: 'https://img.usecurling.com/p/600/400?q=fresh%20salad',
  wrap: 'https://img.usecurling.com/p/600/400?q=wrap%20sandwich',
  bowl: 'https://img.usecurling.com/p/600/400?q=acai%20bowl%20fruits',
  lanche: 'https://img.usecurling.com/p/600/400?q=gourmet%20toast%20brunch',
  toast: 'https://img.usecurling.com/p/600/400?q=avocado%20toast',
  drink: 'https://img.usecurling.com/p/600/400?q=cocktail%20drink',
  prato: 'https://img.usecurling.com/p/600/400?q=gourmet%20dish',
}

function getItemImage(item: MenuItem): string {
  const name = item.name.toLowerCase()
  const cat = (item.category || '').toLowerCase()

  if (name.includes('açai') || name.includes('açaí') || cat.includes('bowl')) {
    return 'https://img.usecurling.com/p/600/400?q=acai%20bowl'
  }
  if (name.includes('suco') || name.includes('smoothie') || cat.includes('suco')) {
    return 'https://img.usecurling.com/p/600/400?q=orange%20juice%20smoothie'
  }
  if (name.includes('toast') || name.includes('avocado') || name.includes('salmão defumado')) {
    return 'https://img.usecurling.com/p/600/400?q=avocado%20salmon%20toast'
  }
  if (name.includes('café') || name.includes('expresso') || name.includes('cappuccino')) {
    return 'https://img.usecurling.com/p/600/400?q=espresso%20cup%20latte'
  }
  if (name.includes('brownie') || name.includes('cheesecake') || cat.includes('sobremesa')) {
    return 'https://img.usecurling.com/p/600/400?q=chocolate%20cake%20dessert'
  }
  if (name.includes('salada') || cat.includes('salada')) {
    return 'https://img.usecurling.com/p/600/400?q=gourmet%20caesar%20salad'
  }
  if (name.includes('tapioca') || name.includes('pão de queijo') || name.includes('ovos')) {
    return 'https://img.usecurling.com/p/600/400?q=breakfast%20scrambled%20eggs'
  }
  if (
    name.includes('filé') ||
    name.includes('pato') ||
    name.includes('carne') ||
    cat.includes('prato')
  ) {
    return 'https://img.usecurling.com/p/600/400?q=steak%20gourmet%20dinner'
  }
  if (
    name.includes('drink') ||
    name.includes('caipirinha') ||
    name.includes('gin') ||
    name.includes('whisky')
  ) {
    return 'https://img.usecurling.com/p/600/400?q=cocktail%20beverage'
  }
  if (name.includes('refrigerante') || name.includes('água') || name.includes('limonada')) {
    return 'https://img.usecurling.com/p/600/400?q=lemonade%20refreshing%20drink'
  }

  return 'https://img.usecurling.com/p/600/400?q=restaurant%20food%20plate'
}

function isBeverage(item: MenuItem): boolean {
  const cat = (item.category || '').toLowerCase()
  const name = item.name.toLowerCase()
  return (
    cat.includes('suco') ||
    cat.includes('smoothie') ||
    cat.includes('soft') ||
    cat.includes('bebid') ||
    cat.includes('drink') ||
    cat.includes('coquet') ||
    cat.includes('dose') ||
    cat.includes('bar') ||
    name.includes('suco') ||
    name.includes('smoothie') ||
    name.includes('café') ||
    name.includes('água') ||
    name.includes('refrigerante') ||
    name.includes('limonada') ||
    name.includes('drink') ||
    name.includes('cerveja') ||
    name.includes('vinho')
  )
}

interface CartItem {
  item: MenuItem
  quantity: number
  notes?: string
}

export default function DigitalMenu() {
  const { toast } = useToast()

  // Comanda information
  const [tableNumber, setTableNumber] = useState<string>(() => {
    return localStorage.getItem('oniceli_client_table') || ''
  })
  const [customerName, setCustomerName] = useState<string>(() => {
    return localStorage.getItem('oniceli_client_name') || ''
  })
  const [isComandaModalOpen, setIsComandaModalOpen] = useState(false)
  const [isEditingComanda, setIsEditingComanda] = useState(false)

  // Data & filters
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Cart / Tray state
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [sendingOrder, setSendingOrder] = useState(false)

  // Live order tracker modal/sheet
  const [sentOrderNumber, setSentOrderNumber] = useState<string | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [myOrderIds, setMyOrderIds] = useState<{ kitchenId?: string; barId?: string }>({})
  const [kitchenStatus, setKitchenStatus] = useState<string | null>(null)
  const [barStatus, setBarStatus] = useState<string | null>(null)

  // Item details modal (to customize or inspect ingredients)
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null)
  const [modalItemNotes, setModalItemNotes] = useState('')
  const [modalItemQty, setModalItemQty] = useState(1)

  // Check if comanda is open on initial load
  useEffect(() => {
    if (!tableNumber) {
      setIsComandaModalOpen(true)
    }
  }, [tableNumber])

  // Load menu items
  const loadMenu = async () => {
    try {
      const items = await getMenuItems()
      setMenuItems(items.filter((i) => i.active !== false))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenu()
  }, [])
  useRealtime('menu_items', () => loadMenu())

  // Realtime tracking for client's sent orders
  const checkLiveOrderStatus = async () => {
    if (!myOrderIds.kitchenId && !myOrderIds.barId) return
    try {
      if (myOrderIds.kitchenId) {
        const k = await pb.collection('kitchen_orders').getOne<KitchenOrder>(myOrderIds.kitchenId)
        setKitchenStatus(k.status)
      }
      if (myOrderIds.barId) {
        const b = await pb.collection('bar_orders').getOne<BarOrder>(myOrderIds.barId)
        setBarStatus(b.status)
      }
    } catch {
      /* ignore */
    }
  }

  useRealtime('kitchen_orders', () => checkLiveOrderStatus())
  useRealtime('bar_orders', () => checkLiveOrderStatus())

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>()
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return ['all', ...Array.from(set).sort()]
  }, [menuItems])

  // Filtered menu
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [menuItems, selectedCategory, searchQuery])

  // Cart operations
  const addToCart = (item: MenuItem, qty = 1, notes = '') => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.item.id === item.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        updated[existingIndex].quantity += qty
        if (notes) updated[existingIndex].notes = notes
        return updated
      }
      return [...prev, { item, quantity: qty, notes }]
    })

    toast({
      title: 'Item adicionado',
      description: `${qty}x ${item.name} foi colocado na comanda.`,
      duration: 2500,
    })
  }

  const updateCartQty = (itemId: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((entry) => {
            if (entry.item.id === itemId) {
              const nextQty = entry.quantity + delta
              return nextQty > 0 ? { ...entry, quantity: nextQty } : null
            }
            return entry
          })
          .filter(Boolean) as CartItem[],
    )
  }

  const removeCartItem = (itemId: string) => {
    setCart((prev) => prev.filter((entry) => entry.item.id !== itemId))
  }

  const updateCartItemNotes = (itemId: string, notes: string) => {
    setCart((prev) => prev.map((entry) => (entry.item.id === itemId ? { ...entry, notes } : entry)))
  }

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0)
  const totalCartPrice = cart.reduce((acc, curr) => acc + (curr.item.price || 0) * curr.quantity, 0)

  // Save comanda
  const handleSaveComanda = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!tableNumber.trim()) {
      toast({
        title: 'Mesa obrigatória',
        description: 'Por favor informe o número da sua mesa para abrir a comanda.',
        variant: 'destructive',
      })
      return
    }
    localStorage.setItem('oniceli_client_table', tableNumber.trim())
    localStorage.setItem('oniceli_client_name', customerName.trim())
    setIsComandaModalOpen(false)
    setIsEditingComanda(false)
    toast({
      title: 'Comanda Aberta com Sucesso!',
      description: `Mesa ${tableNumber.trim()} ${customerName ? '• ' + customerName : ''}`,
      className: 'bg-emerald-600 text-white font-bold',
    })
  }

  // Send order: split into kitchen vs bar automatically
  const handleSendOrder = async () => {
    if (!tableNumber.trim()) {
      setIsComandaModalOpen(true)
      return
    }
    if (cart.length === 0) {
      toast({
        title: 'Comanda vazia',
        description: 'Escolha pelo menos um prato ou bebida antes de enviar o pedido.',
        variant: 'destructive',
      })
      return
    }

    setSendingOrder(true)
    try {
      const kitchenItems: CartItem[] = []
      const barItems: CartItem[] = []

      cart.forEach((c) => {
        if (isBeverage(c.item)) {
          barItems.push(c)
        } else {
          kitchenItems.push(c)
        }
      })

      // Get restaurant owner id (e.g., from first item or default)
      const restaurantUserId = cart[0]?.item?.user_id || undefined
      let createdKitchenOrder: KitchenOrder | null = null
      let createdBarOrder: BarOrder | null = null

      if (kitchenItems.length > 0) {
        const formattedKItems = kitchenItems.map((k) => ({
          menu_item_id: k.item.id,
          name: k.item.name,
          price: k.item.price || 0,
          quantity: k.quantity,
          notes: k.notes || '',
        }))
        const kTotal = kitchenItems.reduce((acc, k) => acc + (k.item.price || 0) * k.quantity, 0)

        createdKitchenOrder = await createKitchenOrder({
          restaurant_id: restaurantUserId,
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || undefined,
          items: JSON.stringify(formattedKItems),
          status: 'pending',
          total_amount: kTotal,
          stock_deducted: false,
        })
      }

      if (barItems.length > 0) {
        const formattedBItems = barItems.map((b) => ({
          menu_item_id: b.item.id,
          name: b.item.name,
          price: b.item.price || 0,
          quantity: b.quantity,
          notes: b.notes || '',
        }))
        const bTotal = barItems.reduce((acc, b) => acc + (b.item.price || 0) * b.quantity, 0)

        createdBarOrder = await createBarOrder({
          restaurant_id: restaurantUserId,
          table_number: tableNumber.trim(),
          customer_name: customerName.trim() || undefined,
          items: JSON.stringify(formattedBItems),
          status: 'pending',
          total_amount: bTotal,
          stock_deducted: false,
        })
      }

      // Generate order display number (random 4 digits or order ID slice)
      const displayNum = '#' + Math.floor(1000 + Math.random() * 9000)
      setSentOrderNumber(displayNum)
      setMyOrderIds({
        kitchenId: createdKitchenOrder?.id,
        barId: createdBarOrder?.id,
      })
      setKitchenStatus(createdKitchenOrder ? 'pending' : null)
      setBarStatus(createdBarOrder ? 'pending' : null)

      // Clear cart
      setCart([])
      setIsCartOpen(false)
      setIsSuccessModalOpen(true)

      toast({
        title: '🎉 Pedido Enviado com Sucesso!',
        description: `Seu pedido foi direcionado automaticamente para o preparo.`,
        className: 'bg-emerald-600 text-white font-bold',
      })
    } catch (err) {
      toast({
        title: 'Erro ao enviar pedido',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSendingOrder(false)
    }
  }

  const renderStatusStep = (status: string | null, label: string, icon: any) => {
    if (!status) return null
    const isPending = status === 'pending'
    const isPreparing = status === 'preparing'
    const isReady = status === 'ready' || status === 'delivered'
    const IconComp = icon

    return (
      <div className="p-3 rounded-xl border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComp className="h-4 w-4 text-emerald-600" />
            <span className="font-bold text-sm">{label}</span>
          </div>
          {isPending && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-300 gap-1 text-xs"
            >
              <Clock className="h-3 w-3" /> Pendente
            </Badge>
          )}
          {isPreparing && (
            <Badge className="bg-blue-600 hover:bg-blue-600 text-white gap-1 text-xs animate-pulse font-bold">
              <Flame className="h-3 w-3" /> Em Preparo
            </Badge>
          )}
          {isReady && (
            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-xs font-bold animate-bounce">
              <CheckCircle2 className="h-3 w-3" /> Pronto!
            </Badge>
          )}
        </div>

        {/* Visual Progress bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div
            className={`h-2 rounded-full transition-all ${isPending || isPreparing || isReady ? 'bg-amber-500' : 'bg-muted'}`}
          />
          <div
            className={`h-2 rounded-full transition-all ${isPreparing || isReady ? 'bg-blue-600 animate-pulse' : 'bg-muted'}`}
          />
          <div
            className={`h-2 rounded-full transition-all ${isReady ? 'bg-emerald-600' : 'bg-muted'}`}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-muted-foreground">
          <span>Na Fila</span>
          <span>Em Preparo</span>
          <span>Pronto</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Client Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <ChefHat className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-black text-lg leading-tight tracking-tight text-foreground flex items-center gap-1.5">
                Serena Café
                <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                  Digital
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">Cardápio & Pedidos na Mesa</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Table Badge */}
            <button
              onClick={() => {
                setIsEditingComanda(true)
                setIsComandaModalOpen(true)
              }}
              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            >
              <Store className="h-3.5 w-3.5" />
              <span>{tableNumber ? `Mesa ${tableNumber}` : 'Definir Mesa'}</span>
              {customerName && (
                <span className="opacity-75 hidden sm:inline">({customerName})</span>
              )}
            </button>

            {/* Login / Staff link */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-xs text-muted-foreground hidden sm:flex"
            >
              <Link to="/login">Área do Restaurante</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-4 md:py-6 flex-1 w-full space-y-5 pb-28">
        {/* Welcome / Comanda Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 md:p-6 text-white shadow-lg">
          <div className="relative z-10 max-w-xl space-y-2">
            <Badge className="bg-white/20 hover:bg-white/30 text-white text-xs border-none backdrop-blur font-semibold">
              ✨ Peça diretamente pelo seu celular
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Faça seu pedido sem filas e em instantes!
            </h2>
            <p className="text-sm text-emerald-50 leading-relaxed">
              Pratos vão para a Cozinha e bebidas vão para o Bar em tempo real. Acompanhe o status
              do preparo direto na sua tela.
            </p>
          </div>
          {/* Subtle background art */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none">
            <ChefHat className="w-48 h-48 text-white" />
          </div>
        </div>

        {/* Live Order Tracker Banner (if active) */}
        {sentOrderNumber && (kitchenStatus || barStatus) && (
          <Card className="border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <CardTitle className="text-base font-bold text-foreground">
                    Pedido em Andamento: {sentOrderNumber}
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsSuccessModalOpen(true)}
                  className="text-xs h-7 gap-1 border-emerald-400 font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  Ver Detalhes <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0">
              {kitchenStatus && renderStatusStep(kitchenStatus, 'Cozinha (Pratos)', ChefHat)}
              {barStatus && renderStatusStep(barStatus, 'Bar (Bebidas)', Wine)}
            </CardContent>
          </Card>
        )}

        {/* Search & Category Filter Section */}
        <div className="space-y-3 sticky top-16 z-20 bg-slate-50/95 dark:bg-slate-950/95 py-2 backdrop-blur">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por prato, suco, lanche, ingrediente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background border-border shadow-sm rounded-xl text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Horizontal Category Pill Carousel */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat
              const label = cat === 'all' ? '🍽️ Todos' : cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all select-none min-h-[38px] ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                      : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Menu Grid Items */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className="overflow-hidden border animate-pulse">
                <div className="h-44 bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-8 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed py-16 text-center">
            <CardContent className="space-y-3">
              <div className="p-4 rounded-full bg-muted inline-flex">
                <Utensils className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-lg">Nenhum prato encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Tente ajustar os filtros ou digitar outro termo na busca acima.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory('all')
                  setSearchQuery('')
                }}
                className="mt-2"
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const isDrink = isBeverage(item)
              const imageUrl = getItemImage(item)
              const inCart = cart.find((c) => c.item.id === item.id)

              let ingredientsList: any[] = []
              try {
                ingredientsList = JSON.parse(item.ingredients || '[]')
              } catch {
                ingredientsList = []
              }

              return (
                <Card
                  key={item.id}
                  className="overflow-hidden border border-border hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between group shadow-sm hover:shadow-md bg-card"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedItemForModal(item)
                      setModalItemQty(1)
                      setModalItemNotes('')
                    }}
                  >
                    {/* Item Image with Category Badge */}
                    <div className="relative h-44 w-full overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <Badge className="bg-background/90 hover:bg-background/90 text-foreground font-semibold backdrop-blur text-xs border shadow-sm">
                          {item.category || 'Geral'}
                        </Badge>
                        {isDrink ? (
                          <Badge className="bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-[10px] gap-1 shadow-sm">
                            <Wine className="h-3 w-3" /> Bar
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-[10px] gap-1 shadow-sm">
                            <ChefHat className="h-3 w-3" /> Cozinha
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-base leading-snug text-foreground group-hover:text-emerald-600 transition-colors">
                          {item.name}
                        </h3>
                      </div>

                      {ingredientsList.length > 0 && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {ingredientsList
                            .map((i: any) => i.name || i.item)
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer with Price and Add Action */}
                  <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t mt-2 pt-3">
                    <div>
                      <span className="text-xs text-muted-foreground block font-medium">Preço</span>
                      <span className="font-mono font-bold text-lg text-emerald-700 dark:text-emerald-400">
                        R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    {inCart ? (
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-1 rounded-xl">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-700 rounded-lg hover:bg-emerald-200/50"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateCartQty(item.id, -1)
                          }}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="font-mono font-bold text-sm w-6 text-center text-emerald-900 dark:text-emerald-100">
                          {inCart.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-emerald-700 rounded-lg hover:bg-emerald-200/50"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateCartQty(item.id, 1)
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => addToCart(item, 1)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-3 gap-1.5 shadow-sm rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Tray / Cart Pill Button (Bottom) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-5 inset-x-0 z-40 max-w-md mx-auto px-4 animate-fade-in-up">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-14 rounded-2xl shadow-2xl flex items-center justify-between px-5 text-base border border-emerald-400/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-black">
                {totalCartCount}
              </div>
              <span>Ver Minha Comanda</span>
            </div>
            <span className="font-mono font-extrabold text-lg">
              R$ {totalCartPrice.toFixed(2).replace('.', ',')}
            </span>
          </Button>
        </div>
      )}

      {/* Item Detail / Customization Modal */}
      <Dialog
        open={!!selectedItemForModal}
        onOpenChange={(v) => !v && setSelectedItemForModal(null)}
      >
        {selectedItemForModal && (
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl">
            <div className="relative h-56 w-full bg-muted">
              <img
                src={getItemImage(selectedItemForModal)}
                alt={selectedItemForModal.name}
                className="h-full w-full object-cover"
              />
              <Badge className="absolute top-3 left-3 bg-background/90 text-foreground font-semibold backdrop-blur">
                {selectedItemForModal.category || 'Prato'}
              </Badge>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <DialogTitle className="text-xl font-bold leading-tight">
                  {selectedItemForModal.name}
                </DialogTitle>
                <p className="font-mono font-bold text-xl text-emerald-600 mt-1">
                  R$ {(selectedItemForModal.price || 0).toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Ingredients breakdown */}
              {(() => {
                let ings: any[] = []
                try {
                  ings = JSON.parse(selectedItemForModal.ingredients || '[]')
                } catch {
                  ings = []
                }
                if (ings.length === 0) return null
                return (
                  <div className="space-y-1.5 bg-muted/40 p-3 rounded-xl border">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      Ingredientes e composição:
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {ings.map((ing, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-background">
                          {ing.name || ing.item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Notes Input */}
              <div className="space-y-1.5">
                <Label htmlFor="item-obs" className="text-xs font-semibold">
                  Observações para o preparo (opcional):
                </Label>
                <Input
                  id="item-obs"
                  placeholder="Ex: sem cebola, ponto da carne, pouco gelo, sem açúcar..."
                  value={modalItemNotes}
                  onChange={(e) => setModalItemNotes(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-semibold">Quantidade:</span>
                <div className="flex items-center gap-2 border rounded-xl p-1 bg-muted/20">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setModalItemQty(Math.max(1, modalItemQty - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-mono font-bold text-base w-8 text-center">
                    {modalItemQty}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setModalItemQty(modalItemQty + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={() => {
                    addToCart(selectedItemForModal, modalItemQty, modalItemNotes)
                    setSelectedItemForModal(null)
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base rounded-xl gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Adicionar à Comanda · R${' '}
                  {((selectedItemForModal.price || 0) * modalItemQty).toFixed(2).replace('.', ',')}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Cart / Comanda Drawer Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-emerald-600" /> Minha Comanda
                </SheetTitle>
                <SheetDescription className="mt-0.5">
                  Mesa {tableNumber || 'Não definida'} {customerName && `· ${customerName}`}
                </SheetDescription>
              </div>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8"
                >
                  Limpar
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Cart items scrollable area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {cart.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="p-4 rounded-full bg-muted inline-flex">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="font-bold text-base">Sua comanda está vazia</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Toque nos itens do cardápio para adicionar pratos ou bebidas.
                </p>
              </div>
            ) : (
              cart.map((entry) => {
                const isDrink = isBeverage(entry.item)
                return (
                  <div
                    key={entry.item.id}
                    className="p-3 rounded-xl border bg-card space-y-2.5 shadow-sm text-sm"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[9px] px-1 py-0 ${
                              isDrink
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            }`}
                          >
                            {isDrink ? 'BAR' : 'COZINHA'}
                          </Badge>
                          <span className="font-bold truncate text-foreground leading-tight">
                            {entry.item.name}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-muted-foreground mt-0.5">
                          R$ {(entry.item.price || 0).toFixed(2).replace('.', ',')} cada
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => updateCartQty(entry.item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-mono font-bold text-sm w-5 text-center">
                          {entry.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 rounded-lg"
                          onClick={() => updateCartQty(entry.item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-700 ml-0.5"
                          onClick={() => removeCartItem(entry.item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Observação inline */}
                    <Input
                      placeholder="Obs do item (ex: bem passado, sem gelo)..."
                      value={entry.notes || ''}
                      onChange={(e) => updateCartItemNotes(entry.item.id, e.target.value)}
                      className="h-7 text-xs bg-muted/40 rounded-lg"
                    />
                  </div>
                )
              })
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t bg-muted/20 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Itens ({totalCartCount})</span>
                  <span className="font-mono">
                    R$ {totalCartPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg text-foreground pt-1 border-t">
                  <span>Total do Pedido</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    R$ {totalCartPrice.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSendOrder}
                disabled={sendingOrder || cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-14 rounded-xl text-base shadow-lg shadow-emerald-600/30 gap-2"
              >
                <Send className="h-5 w-5" />
                {sendingOrder ? 'ENVIANDO PEDIDO...' : 'ENVIAR PEDIDO'}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Pratos e bebidas são enviados diretamente para os displays de preparo.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Comanda Opening Modal (Table and Customer Name) */}
      <Dialog open={isComandaModalOpen} onOpenChange={setIsComandaModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center sm:text-left">
            <div className="mx-auto sm:mx-0 p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 w-fit mb-2">
              <Store className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-bold">
              {isEditingComanda ? 'Alterar Mesa / Comanda' : 'Bem-vindo ao Serena Café'}
            </DialogTitle>
            <DialogDescription>
              Informe o número da sua mesa para que a equipe entregue seus pedidos no local correto.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveComanda} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="modal-table" className="text-sm font-bold">
                Número da Mesa / Comanda *
              </Label>
              <Input
                id="modal-table"
                placeholder="Ex: 04, Mesa 12, Balcão 2..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                autoFocus
                required
                className="h-12 text-base font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal-name" className="text-sm">
                Seu Nome (Opcional)
              </Label>
              <Input
                id="modal-name"
                placeholder="Como podemos te chamar?"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={!tableNumber.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 text-base rounded-xl"
              >
                Confirmar e Ver Cardápio <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation & Status Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 w-fit mb-2 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <DialogTitle className="text-2xl font-black">Pedido Realizado!</DialogTitle>
            <DialogDescription className="text-sm">
              Pedido <strong className="text-foreground">{sentOrderNumber}</strong> enviado para a
              Mesa <strong className="text-foreground">{tableNumber}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {kitchenStatus &&
              renderStatusStep(kitchenStatus, 'Cozinha (Pratos & Lanches)', ChefHat)}
            {barStatus && renderStatusStep(barStatus, 'Bar (Bebidas & Doses)', Wine)}

            <div className="p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground text-center">
              Você pode continuar navegando pelo cardápio e adicionar mais itens a qualquer momento.
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl"
            >
              Continuar no Cardápio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
