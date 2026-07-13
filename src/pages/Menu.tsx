import { useState, useEffect, useCallback, useMemo } from 'react'
import { BookOpen, Search, UtensilsCrossed, Loader2, PackageOpen } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRealtime } from '@/hooks/use-realtime'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import { cn } from '@/lib/utils'

interface Ingredient {
  inventory_id?: string
  name: string
  quantity: number
  unit: string
}

function parseIngredients(raw: string): Ingredient[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* ignore */
  }
  return []
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const loadData = useCallback(async () => {
    try {
      const items = await getMenuItems()
      setMenuItems(items)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('menu_items', () => loadData())

  const categories = useMemo(() => {
    const set = new Set<string>()
    menuItems.forEach((item) => {
      if (item.category) set.add(item.category)
    })
    return Array.from(set).sort()
  }, [menuItems])

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [menuItems, search, categoryFilter])

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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Cardápio
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualize todos os pratos com preços, custos e ingredientes.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar prato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <PackageOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg mb-1">Nenhum prato encontrado</CardTitle>
            <CardDescription>
              {menuItems.length === 0
                ? 'Nenhum dado encontrado para o seu restaurante. Adicione receitas para começar.'
                : 'Tente ajustar a busca ou o filtro de categoria.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const ingredients = parseIngredients(item.ingredients)
            const margin =
              item.margin || (item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0)
            return (
              <Card
                key={item.id}
                className="hover:border-primary/40 transition-colors flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <Badge variant="secondary" className="mb-2 bg-slate-100 text-slate-800">
                        {item.category || 'Sem categoria'}
                      </Badge>
                      <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
                    </div>
                    <Badge
                      className={cn(
                        'shrink-0 border-none',
                        item.active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-100',
                      )}
                    >
                      {item.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Preço
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        R$ {formatCurrency(item.price || 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Custo
                      </p>
                      <p className="text-sm font-semibold text-red-500">
                        R$ {formatCurrency(item.cost || 0)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Margem
                      </p>
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          margin >= 70
                            ? 'text-emerald-600'
                            : margin >= 50
                              ? 'text-amber-500'
                              : 'text-red-500',
                        )}
                      >
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {ingredients.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <UtensilsCrossed className="h-3 w-3" />
                        Ingredientes ({ingredients.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ingredients.map((ing, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-[11px] font-normal py-0.5"
                          >
                            {ing.name}
                            <span className="text-muted-foreground ml-1">
                              {ing.quantity}
                              {ing.unit}
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
