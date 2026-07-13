import { useState, useEffect, useCallback } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getSales, createSale, type SaleRecord } from '@/services/sales'
import { getMenuItems, type MenuItem } from '@/services/menu-items'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function Sales() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const loadData = useCallback(async () => {
    try {
      const [s, m] = await Promise.all([getSales(), getMenuItems()])
      setSales(s)
      setMenuItems(m)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('sales_data', () => loadData())

  const chartData = sales
    .reduce(
      (acc, s) => {
        const date = s.date?.split(' ')[0] || ''
        const existing = acc.find((a) => a.date === date)
        if (existing) {
          existing.vendas += s.total_price || 0
          existing.qty += s.quantity_sold || 0
        } else acc.push({ date, vendas: s.total_price || 0, qty: s.quantity_sold || 0 })
        return acc
      },
      [] as { date: string; vendas: number; qty: number }[],
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  const topItems = menuItems
    .map((m) => {
      const qty = sales
        .filter((s) => s.item_id === m.id)
        .reduce((sum, s) => sum + (s.quantity_sold || 0), 0)
      return { name: m.name, margin: (m.margin || 0).toFixed(1) + '%', vol: qty }
    })
    .filter((i) => i.vol > 0)
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 5)

  const filteredMenu = menuItems.filter(
    (m) => m.active && m.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleSubmitDaily = async () => {
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0)
    if (entries.length === 0) {
      toast({
        title: 'Nenhuma venda',
        description: 'Informe ao menos uma quantidade.',
        variant: 'destructive',
      })
      return
    }
    setSubmitting(true)
    try {
      for (const [itemId, qty] of entries) {
        const menuItem = menuItems.find((m) => m.id === itemId)
        await createSale({
          item_id: itemId,
          quantity_sold: qty,
          date: saleDate,
          total_price: (menuItem?.price || 0) * qty,
          user_id: user?.id || '',
        })
      }
      toast({
        title: 'Vendas registradas!',
        description: `${entries.length} item(s) salvos com sucesso.`,
      })
      setQuantities({})
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vendas</h1>
        <p className="text-muted-foreground mt-1">
          Registre vendas diárias e acompanhe tendências.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Registro de Vendas Diárias</CardTitle>
          <CardDescription>Selecione os pratos vendidos e informe a quantidade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="sm:w-48"
              />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Buscar prato</Label>
              <Input
                placeholder="Digite o nome do prato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 max-h-[350px] overflow-y-auto rounded-lg border p-2 bg-muted/20">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredMenu.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum prato encontrado.
              </p>
            ) : (
              filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-md bg-background border"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      R$ {(item.price || 0).toFixed(2)} · Margem {(item.margin || 0).toFixed(1)}%
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-20 text-center"
                    value={quantities[item.id] || ''}
                    onChange={(e) =>
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              ))
            )}
          </div>
          <Button
            onClick={handleSubmitDaily}
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registrando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Registrar Vendas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Data</CardTitle>
            <CardDescription>Receita por dia</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Carregando...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Pratos</CardTitle>
            <CardDescription>Mais vendidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma venda registrada.
                </p>
              )}
              {topItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.vol} pedidos</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-600">{item.margin}</p>
                    <p className="text-xs text-muted-foreground">Margem</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
