import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Plus,
  Edit,
  Upload,
  Package,
  Phone,
  Mail,
  Clock,
  Star,
  ClipboardList,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import { getSuppliers, parseProducts, type Supplier } from '@/services/suppliers'
import { SupplierFinancialSummary } from '@/components/supplier-financial-summary'
import { SupplierBulkImport } from '@/components/supplier-bulk-import'
import { SupplierPaymentProfile } from '@/components/supplier-payment-profile'
import { SupplierFormDialog } from '@/components/supplier-form-dialog'
import { SupplierKPIs } from '@/components/supplier-kpis'
import { SupplierLeadTimeCard } from '@/components/supplier-lead-time-card'
import { SupplierOrderStatusBreakdown } from '@/components/supplier-order-status-breakdown'

export default function SupplierDashboard() {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [bulkImportOpen, setBulkImportOpen] = useState(false)

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
  const products = myProfile ? parseProducts(myProfile.products) : []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Painel do Fornecedor</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu perfil, catálogo e finanças.</p>
        </div>
        {myProfile ? (
          <Button onClick={() => setFormOpen(true)} className="bg-emerald-600">
            <Edit className="mr-2 h-4 w-4" /> Editar Perfil
          </Button>
        ) : (
          <Button onClick={() => setFormOpen(true)} className="bg-emerald-600">
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
            <Button onClick={() => setFormOpen(true)} className="bg-emerald-600">
              <Plus className="mr-2 h-4 w-4" /> Criar Perfil
            </Button>
          </CardContent>
        </Card>
      )}

      {myProfile && (
        <>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" /> Área Financeira
            </h2>
            <p className="text-sm text-muted-foreground">
              Total de pedidos recebidos e desempenho financeiro
            </p>
          </div>

          <SupplierKPIs supplierId={myProfile.id} />

          <SupplierOrderStatusBreakdown supplierId={myProfile.id} />

          <SupplierFinancialSummary supplierId={myProfile.id} />

          <SupplierLeadTimeCard supplier={myProfile} onUpdated={loadData} />

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <ClipboardList className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">Gerenciar Pedidos</p>
                  <p className="text-sm text-emerald-700">
                    Acompanhe e atualize o status dos pedidos recebidos
                  </p>
                </div>
              </div>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/supplier/pedidos">Ver Pedidos</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{myProfile.name}</span>
                </div>
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
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Categorias:</p>
                  <p className="text-sm">{myProfile.categories || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Catálogo de Produtos</CardTitle>
                    <CardDescription>{products.length} produtos</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setBulkImportOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Importar Planilha
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto. Use a importação ou edite seu perfil.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.sku || '-'}</TableCell>
                          <TableCell className="text-right font-mono">
                            {p.price ? `R$ ${p.price.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <SupplierPaymentProfile supplier={myProfile} onUpdated={loadData} />
        </>
      )}

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        profile={myProfile || null}
        user={user}
        onSaved={loadData}
      />

      {myProfile && (
        <SupplierBulkImport
          open={bulkImportOpen}
          onOpenChange={setBulkImportOpen}
          supplierId={myProfile.id}
          existingProducts={products}
          onImported={loadData}
        />
      )}
    </div>
  )
}
