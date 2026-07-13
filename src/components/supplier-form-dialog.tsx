import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { useToast } from '@/hooks/use-toast'
import {
  createSupplier,
  updateSupplier,
  parseProducts,
  type Supplier,
  type ProductEntry,
} from '@/services/suppliers'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Supplier | null
  user: { id: string; name: string; email: string }
  onSaved: () => void
}

export function SupplierFormDialog({ open, onOpenChange, profile, user, onSaved }: Props) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<Supplier>>({})
  const [products, setProducts] = useState<ProductEntry[]>([])
  const [newName, setNewName] = useState('')
  const [newSku, setNewSku] = useState('')
  const [newPrice, setNewPrice] = useState('')

  useEffect(() => {
    if (!open) return
    if (profile) {
      setFormData(profile)
      setProducts(parseProducts(profile.products))
    } else {
      setFormData({
        name: user.name || '',
        phone: '',
        email: user.email || '',
        categories: '',
        delivery_lead_time: 2,
        rating: 0,
        status: 'active',
      })
      setProducts([])
    }
    setNewName('')
    setNewSku('')
    setNewPrice('')
  }, [open, profile, user])

  const addProduct = () => {
    if (!newName.trim()) return
    if (newSku && products.some((p) => p.sku === newSku)) {
      toast({ title: 'SKU duplicado', variant: 'destructive' })
      return
    }
    setProducts([
      ...products,
      { name: newName.trim(), sku: newSku || undefined, price: parseFloat(newPrice) || undefined },
    ])
    setNewName('')
    setNewSku('')
    setNewPrice('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, products: JSON.stringify(products), user_id: user.id }
      if (profile) {
        await updateSupplier(profile.id, payload)
        toast({ title: 'Perfil atualizado!' })
      } else {
        await createSupplier(payload)
        toast({ title: 'Perfil criado!' })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{profile ? 'Editar Perfil' : 'Criar Perfil'}</DialogTitle>
          <DialogDescription>Atualize suas informações.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Nome</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Categorias</Label>
              <Input
                value={formData.categories || ''}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                className="col-span-3"
                placeholder="Ex: Peixes, Frutos do Mar"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Telefone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Email</Label>
              <Input
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Prazo (dias)</Label>
              <Input
                type="number"
                value={formData.delivery_lead_time || 0}
                onChange={(e) =>
                  setFormData({ ...formData, delivery_lead_time: parseInt(e.target.value) || 0 })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-3">
              <Label className="text-right pt-2">Produtos</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-1.5">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nome"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addProduct()
                      }
                    }}
                    className="flex-1"
                  />
                  <Input
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="SKU"
                    className="w-24"
                  />
                  <Input
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Preço"
                    type="number"
                    className="w-24"
                  />
                  <Button type="button" size="sm" onClick={addProduct}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {products.map((p, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      {p.name}
                      {p.sku ? ` (${p.sku})` : ''}
                      <button
                        type="button"
                        onClick={() => setProducts(products.filter((_, idx) => idx !== i))}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
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
