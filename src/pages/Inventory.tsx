import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, MoreHorizontal, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import {
  getInventory,
  createInventoryItem,
  computeStatus,
  type InventoryItem,
} from '@/services/inventory'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

const storageOptions = ['Todos', 'Câmara Fria', 'Freezer', 'Geladeira', 'Estoque Seco']

export default function Inventory() {
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [storageFilter, setStorageFilter] = useState('Todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    quantity: 0,
    unit: 'kg',
    unit_cost: 0,
    min_stock: 0,
    expiry_date: '',
    supplier_id: '',
  })
  const [suppliers, setSuppliers] = useState<any[]>([])

  const loadInventory = useCallback(async () => {
    try {
      const data = await getInventory()
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInventory()
  }, [loadInventory])
  useRealtime('inventory', () => loadInventory())

  useEffect(() => {
    pb.collection('suppliers')
      .getFullList()
      .then(setSuppliers)
      .catch(() => {})
  }, [])

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStorage = storageFilter === 'Todos' || item.location === storageFilter
    return matchesSearch && matchesStorage
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const status = computeStatus(formData.quantity, formData.min_stock, formData.expiry_date)
      await createInventoryItem({ ...formData, status })
      toast({
        title: 'Ingrediente adicionado!',
        description: `${formData.name} foi cadastrado no estoque.`,
      })
      setDialogOpen(false)
      setFormData({
        name: '',
        category: '',
        location: '',
        quantity: 0,
        unit: 'kg',
        unit_cost: 0,
        min_stock: 0,
        expiry_date: '',
        supplier_id: '',
      })
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Controle de Estoque</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gerencie ingredientes e monitore níveis de armazenamento.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
              <Plus className="mr-2 h-4 w-4" /> Novo Ingrediente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Ingrediente</DialogTitle>
              <DialogDescription>Preencha os dados do novo ingrediente.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Categoria</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Local</Label>
                  <Select
                    value={formData.location}
                    onValueChange={(v) => setFormData({ ...formData, location: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {storageOptions
                        .filter((o) => o !== 'Todos')
                        .map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Qtd</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Custo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Mín</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Validade</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Fornecedor</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg">Inventário Atual</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ingredientes..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={storageFilter} onValueChange={setStorageFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {storageOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <>
              <div className="md:hidden divide-y">
                {filtered.map((item) => (
                  <div key={item.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="font-normal">
                        {item.location}
                      </Badge>
                      <span className="font-mono">R$ {item.unit_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        Qtd:{' '}
                        <span className="font-medium text-foreground">
                          {item.quantity} {item.unit}
                        </span>{' '}
                        (mín: {item.min_stock})
                      </span>
                      <span>
                        {item.expiry_date
                          ? new Date(item.expiry_date).toLocaleDateString('pt-BR')
                          : '-'}
                      </span>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum ingrediente encontrado.
                  </div>
                )}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-right">Custo</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div>{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {item.location}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          R$ {item.unit_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">{item.quantity}</span> {item.unit}
                          <div className="text-[10px] text-muted-foreground">
                            Min: {item.min_stock}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.expiry_date
                            ? new Date(item.expiry_date).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem>Ajustar Estoque</DropdownMenuItem>
                              <DropdownMenuItem>Ver Histórico</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Remover</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Nenhum ingrediente encontrado.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
