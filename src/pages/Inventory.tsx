import { useState } from 'react'
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
import { mockInventory } from '@/lib/data'
import { StatusBadge } from '@/components/status-badge'

const storageOptions = ['Todos', 'Câmara Fria', 'Freezer', 'Geladeira', 'Estoque Seco']

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [storageFilter, setStorageFilter] = useState('Todos')

  const filtered = mockInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStorage = storageFilter === 'Todos' || item.location === storageFilter
    return matchesSearch && matchesStorage
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Controle de Estoque</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gerencie ingredientes e monitore níveis de armazenamento.
          </p>
        </div>
        <Dialog>
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input id="name" placeholder="Ex: Azeite Trufado" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Categoria</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="secos">Secos</SelectItem>
                    <SelectItem value="laticinios">Laticínios</SelectItem>
                    <SelectItem value="carnes">Carnes</SelectItem>
                    <SelectItem value="hortifruti">Hortifruti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Armazém</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camara">Câmara Fria</SelectItem>
                    <SelectItem value="freezer">Freezer</SelectItem>
                    <SelectItem value="geladeira">Geladeira</SelectItem>
                    <SelectItem value="seco">Estoque Seco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="min" className="text-right">
                  Qtd Min
                </Label>
                <Input id="min" type="number" className="col-span-3" placeholder="5" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-emerald-600">
                Salvar
              </Button>
            </DialogFooter>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="min-w-[180px]">Item</TableHead>
                  <TableHead className="min-w-[120px]">Local</TableHead>
                  <TableHead className="text-right min-w-[100px]">Custo</TableHead>
                  <TableHead className="text-right min-w-[100px]">Qtd</TableHead>
                  <TableHead className="min-w-[90px]">Validade</TableHead>
                  <TableHead className="text-center min-w-[90px]">Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.category}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal whitespace-nowrap">
                        {item.location}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm whitespace-nowrap">
                      R$ {item.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <span className="font-medium">{item.quantity}</span> {item.unit}
                      <div className="text-[10px] text-muted-foreground">
                        Min: {item.minQuantity}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{item.expiry}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
