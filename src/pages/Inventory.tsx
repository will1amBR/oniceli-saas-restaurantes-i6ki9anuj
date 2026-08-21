import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, MoreHorizontal } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { InventoryFormDialog } from '@/components/inventory-form-dialog'
import { WasteLogDialog } from '@/components/waste-log-dialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { getInventory, deleteInventoryItem, type InventoryItem } from '@/services/inventory'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

const storageOptions = ['Todos', 'Câmara Fria', 'Freezer', 'Geladeira', 'Estoque Seco']

export default function Inventory() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [storageFilter, setStorageFilter] = useState('Todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [wasteItem, setWasteItem] = useState<InventoryItem | null>(null)
  const [wasteOpen, setWasteOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])

  const loadData = useCallback(async () => {
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
    loadData()
  }, [loadData])
  useRealtime('inventory', () => loadData())

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

  const handleDelete = async (id: string) => {
    try {
      await deleteInventoryItem(id)
      toast({ title: 'Item removido', description: 'O ingrediente foi excluído.' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const openEdit = (item: InventoryItem) => {
    setEditItem(item)
    setDialogOpen(true)
  }
  const openCreate = () => {
    setEditItem(null)
    setDialogOpen(true)
  }
  const openWaste = (item: InventoryItem) => {
    setWasteItem(item)
    setWasteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Controle de Estoque</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie ingredientes e monitore níveis.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Novo Ingrediente
        </Button>
      </div>

      <InventoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        suppliers={suppliers}
        userId={user?.id || ''}
        onSaved={loadData}
      />
      <WasteLogDialog
        open={wasteOpen}
        onOpenChange={setWasteOpen}
        item={wasteItem}
        userId={user?.id || ''}
        onSaved={loadData}
      />

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-3">
            <CardTitle className="text-lg">Inventário Atual</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
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
                        <span className="font-medium">
                          {item.quantity} {item.unit}
                        </span>
                        {item.dose_padrao_ml &&
                        (item.unit?.toLowerCase() === 'ml' || item.quantity > 0) ? (
                          <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                            ~{Math.floor(item.quantity / item.dose_padrao_ml)} doses (
                            {item.dose_padrao_ml}ml)
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted-foreground">
                            Min: {item.min_stock} {item.unit}
                          </div>
                        )}
                        {item.real_stock_ml !== undefined && item.dose_padrao_ml && (
                          <div className="text-[9px] text-muted-foreground">
                            Real: {item.real_stock_ml}ml
                          </div>
                        )}
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
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openWaste(item)}>
                              Registrar Desperdício
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(item.id)}
                            >
                              Remover
                            </DropdownMenuItem>
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
          )}
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
                    (mín: {item.min_stock} {item.unit})
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(item)}>Editar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openWaste(item)}>
                        Desperdício
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(item.id)}
                      >
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum ingrediente encontrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
