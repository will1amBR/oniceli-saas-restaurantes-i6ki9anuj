import { useState, useEffect, useCallback } from 'react'
import { Plus, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    item_id: '',
    quantity_sold: 1,
    date: '',
    total_price: 0,
  })

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
      const itemSales = sales.filter((s) => s.item_id === m.id)
      const qty = itemSales.reduce((sum, s) => sum + (s.quantity_sold || 0), 0)
      return { name: m.name, margin: m.margin + '%', vol: qty }
    })
    .filter((i) => i.vol > 0)
    .sort((a, b) => b.vol - a.vol)
    .slice(0, 5)

  const handleMenuItemChange = (id: string) => {
    const menuItem = menuItems.find((m) => m.id === id)
    setFormData({
      ...formData,
      item_id: id,
      total_price: (menuItem?.price || 0) * formData.quantity_sold,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSale({ ...formData, user_id: user?.id || '' })
      toast({ title: 'Venda registrada!', description: 'A venda foi salva com sucesso.' })
      setDialogOpen(false)
      setFormData({ item_id: '', quantity_sold: 1, date: '', total_price: 0 })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground mt-1">Análise de pratos vendidos e tendências.</p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              item_id: '',
              quantity_sold: 1,
              date: new Date().toISOString().split('T')[0],
              total_price: 0,
            })
            setDialogOpen(true)
          }}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="mr-2 h-4 w-4" /> Nova Venda
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Venda</DialogTitle>
            <DialogDescription>Registre uma nova venda.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Prato</Label>
                <Select value={formData.item_id} onValueChange={handleMenuItemChange}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Qtd</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity_sold}
                  onChange={(e) => {
                    const q = parseInt(e.target.value) || 1
                    const mi = menuItems.find((m) => m.id === formData.item_id)
                    setFormData({
                      ...formData,
                      quantity_sold: q,
                      total_price: (mi?.price || 0) * q,
                    })
                  }}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-3">
                <Label className="text-right">Total R$</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_price}
                  onChange={(e) =>
                    setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-emerald-600">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
