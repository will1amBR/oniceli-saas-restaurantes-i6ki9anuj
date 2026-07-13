import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  createInventoryItem,
  updateInventoryItem,
  computeStatus,
  type InventoryItem,
} from '@/services/inventory'

const storageOptions = ['Câmara Fria', 'Freezer', 'Geladeira', 'Estoque Seco']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: InventoryItem | null
  suppliers: any[]
  userId: string
  onSaved: () => void
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  item,
  suppliers,
  userId,
  onSaved,
}: Props) {
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

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        location: item.location,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        min_stock: item.min_stock,
        expiry_date: item.expiry_date?.split(' ')[0] || '',
        supplier_id: item.supplier_id || '',
      })
    } else {
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
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const status = computeStatus(formData.quantity, formData.min_stock, formData.expiry_date)
    const payload = { ...formData, status, user_id: userId }
    if (item) {
      await updateInventoryItem(item.id, payload)
    } else {
      await createInventoryItem(payload)
    }
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{item ? 'Editar Ingrediente' : 'Adicionar Ingrediente'}</DialogTitle>
          <DialogDescription>Preencha os dados do ingrediente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Categoria</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Local</Label>
              <Select
                value={formData.location}
                onValueChange={(v) => setFormData({ ...formData, location: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione..." />
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
            <div className="grid grid-cols-4 items-center gap-3">
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
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Medida</Label>
              <Select
                value={formData.unit}
                onValueChange={(v) => setFormData({ ...formData, unit: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="G">G</SelectItem>
                  <SelectItem value="Unidade">Unidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
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
            <div className="grid grid-cols-4 items-center gap-3">
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
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Validade</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
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
  )
}
