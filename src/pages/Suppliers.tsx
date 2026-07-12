import { useState, useEffect, useCallback } from 'react'
import { Plus, Clock, Star, Phone, Mail, Edit, Trash2 } from 'lucide-react'
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

export default function Suppliers() {
  const { user } = useAuth()
  const { toast } = useToast()
  const isSupplier = user?.role === 'supplier'
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
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

  const openCreate = () => {
    setEditSupplier(null)
    setFormData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      categories: '',
      delivery_lead_time: 3,
      rating: 0,
      status: 'active',
    })
    setProducts([])
    setDialogOpen(true)
  }

  const openEdit = (s: Supplier) => {
    setEditSupplier(s)
    setFormData(s)
    try {
      setProducts(JSON.parse(s.products || '[]'))
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
  const removeProduct = (p: string) => setProducts(products.filter((x) => x !== p))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData, products: JSON.stringify(products), user_id: user?.id || '' }
      if (editSupplier) {
        await updateSupplier(editSupplier.id, payload)
        toast({ title: 'Fornecedor atualizado!' })
      } else {
        await createSupplier(payload)
        toast({ title: 'Fornecedor criado!' })
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  if (isSupplier) {
    const myProfile = suppliers.find((s) => s.user_id === user?.id)
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas informações e catálogo.</p>
          </div>
          {myProfile && (
            <Button onClick={() => openEdit(myProfile)} className="bg-emerald-600">
              <Edit className="mr-2 h-4 w-4" /> Editar Perfil
            </Button>
          )}
        </div>
        {!myProfile && !loading && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não tem um perfil de fornecedor.
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
                <CardTitle>Informações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {myProfile.phone || '-'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {myProfile.email || '-'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Prazo:{' '}
                  {myProfile.delivery_lead_time} dias
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-amber-500" /> {myProfile.rating} / 5.0
                </div>
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
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Produtos do Catálogo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {products.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
                  )}
                  {(JSON.parse(myProfile.products || '[]') as string[]).map((p) => (
                    <Badge key={p} variant="outline">
                      {p}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <SupplierFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          formData={formData}
          setFormData={setFormData}
          products={products}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          addProduct={addProduct}
          removeProduct={removeProduct}
          handleSubmit={handleSubmit}
          isEdit={!!editSupplier}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Conecte-se com fornecedores.</p>
        </div>
        <Button onClick={openCreate} className="bg-emerald-600">
          <Plus className="mr-2 h-4 w-4" /> Novo Fornecedor
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <Card key={s.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{s.name}</CardTitle>
                  <CardDescription className="truncate">{s.categories}</CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={`shrink-0 ${s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}
                >
                  {s.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Prazo:</span>
                <span className="font-medium">{s.delivery_lead_time} dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="font-medium">{s.rating}</span>
                <span className="text-muted-foreground">/ 5.0</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Produtos:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    try {
                      return JSON.parse(s.products || '[]') as string[]
                    } catch {
                      return []
                    }
                  })().map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Phone className="h-3 w-3" /> {s.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> <span className="truncate">{s.email}</span>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => openEdit(s)}>
                <Edit className="mr-2 h-3 w-3" /> Editar
              </Button>
            </CardContent>
          </Card>
        ))}
        {suppliers.length === 0 && !loading && (
          <p className="text-muted-foreground col-span-full text-center py-8">
            Nenhum fornecedor cadastrado.
          </p>
        )}
      </div>
      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        products={products}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        addProduct={addProduct}
        removeProduct={removeProduct}
        handleSubmit={handleSubmit}
        isEdit={!!editSupplier}
      />
    </div>
  )
}

function SupplierFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  products,
  newProduct,
  setNewProduct,
  addProduct,
  removeProduct,
  handleSubmit,
  isEdit,
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
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
              <Label className="text-right">Categoria</Label>
              <Input
                value={formData.categories || ''}
                onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                className="col-span-3"
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
                  {products.map((p: string) => (
                    <Badge key={p} variant="outline" className="gap-1">
                      {p}
                      <button type="button" onClick={() => removeProduct(p)}>
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
