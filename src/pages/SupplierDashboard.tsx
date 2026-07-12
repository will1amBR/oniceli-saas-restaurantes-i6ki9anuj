import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Truck, Package, Phone, Mail, Clock, Star, Plus, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getSuppliers, createSupplier, updateSupplier, type Supplier } from '@/services/suppliers'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export default function SupplierDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Supplier>>({})
  const [products, setProducts] = useState<string[]>([])
  const [newProduct, setNewProduct] = useState('')

  const loadData = useCallback(async () => {
    try {
      setSuppliers(await getSuppliers())
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('suppliers', () => loadData())

  if (!user) return null
  if (user.role !== 'supplier') return <Navigate to="/dashboard" replace />

  const myProfile = suppliers.find((s) => s.user_id === user.id)

  const openCreate = () => {
    setFormData({
      name: user.name || '',
      contact: '',
      phone: '',
      email: user.email || '',
      categories: '',
      delivery_lead_time: 2,
      rating: 0,
      status: 'active',
    })
    setProducts([])
    setDialogOpen(true)
  }
  const openEdit = () => {
    if (!myProfile) return
    setFormData(myProfile)
    try {
      setProducts(JSON.parse(myProfile.products || '[]'))
    } catch {
      setProducts([])
    }
    setDialogOpen(true)
  }

  const addProduct = () => {
    if (newProduct.trim()) {
      setProducts([...products, newProduct.trim()])
      setNewProduct('')
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, products: JSON.stringify(products), user_id: user.id }
      if (myProfile) {
        await updateSupplier(myProfile.id, payload)
        toast({ title: 'Perfil atualizado!' })
      } else {
        await createSupplier(payload)
        toast({ title: 'Perfil criado!' })
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Fornecedor</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil e catálogo de produtos.</p>
        </div>
        {myProfile ? (
          <Button onClick={openEdit} className="bg-emerald-600">
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
        ) : (
          <Button onClick={openCreate} className="bg-emerald-600">
            <Plus className="mr-2 h-4 w-4" /> Criar Perfil
          </Button>
        )}
      </div>

      {!myProfile && !loading && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Crie seu perfil de fornecedor para começar.
            </p>
            <Button onClick={openCreate} className="bg-emerald-600">
              <Plus className="mr-2 h-4 w-4" /> Criar Perfil
            </Button>
          </CardContent>
        </Card>
      )}

      {myProfile && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />{' '}
                <span className="font-medium">{myProfile.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" /> {myProfile.phone || '-'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" /> {myProfile.email || '-'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" /> Prazo de entrega:{' '}
                {myProfile.delivery_lead_time} dias
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-amber-500" /> {myProfile.rating} / 5.0
              </div>
              <div>
                <Badge
                  variant="secondary"
                  className={
                    myProfile.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }
                >
                  {myProfile.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Categorias:</p>
                <p className="text-sm">{myProfile.categories || '-'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Catálogo de Produtos</CardTitle>
              <CardDescription>{products.length} produtos cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto no catálogo. Edite seu perfil para adicionar.
                  </p>
                )}
                {products.map((p) => (
                  <Badge key={p} variant="outline" className="text-sm py-1.5">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{myProfile ? 'Editar Perfil' : 'Criar Perfil'}</DialogTitle>
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
                  <div className="flex gap-2">
                    <Input
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                      placeholder="Nome do produto"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addProduct()
                        }
                      }}
                    />
                    <Button type="button" size="sm" onClick={addProduct}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {products.map((p) => (
                      <Badge key={p} variant="outline" className="gap-1">
                        {p}
                        <button
                          type="button"
                          onClick={() => setProducts(products.filter((x) => x !== p))}
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
    </div>
  )
}
