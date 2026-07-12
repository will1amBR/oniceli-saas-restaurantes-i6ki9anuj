import { Plus, Clock, Star, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockSuppliers } from '@/lib/data'
import { useRole } from '@/contexts/role-context'

export default function Suppliers() {
  const { role } = useRole()
  const isSupplier = role === 'supplier'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {isSupplier ? 'Meus Clientes' : 'Fornecedores'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            {isSupplier
              ? 'Gerencie seus pedidos e catálogo de produtos.'
              : 'Conecte-se com fornecedores e acompanhe prazos de entrega.'}
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {isSupplier ? 'Novo Produto' : 'Novo Fornecedor'}
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockSuppliers.map((s) => (
          <Card key={s.id} className="hover:shadow-lg transition-shadow flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">{s.name}</CardTitle>
                  <CardDescription className="truncate">{s.category}</CardDescription>
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
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Prazo:</span>
                <span className="font-medium">{s.leadTime} dias</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium">{s.rating}</span>
                <span className="text-muted-foreground">/ 5.0</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Produtos ofertados:</p>
                <div className="flex flex-wrap gap-1.5">
                  {s.products.map((p) => (
                    <Badge key={p} variant="outline" className="text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Phone className="h-3 w-3 shrink-0" /> {s.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{s.email}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
