import { ShoppingBag, Search, ExternalLink, CalendarClock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockPurchases } from '@/lib/data'

export default function Purchases() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Entregue':
        return 'bg-emerald-100 text-emerald-800'
      case 'Solicitado':
        return 'bg-blue-100 text-blue-800'
      case 'Em Trânsito':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras e Fornecedores</h1>
          <p className="text-muted-foreground mt-1">
            Conecte-se com o marketplace e acompanhe pedidos.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <ShoppingBag className="mr-2 h-4 w-4" /> Fazer Pedido
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle>Histórico de Pedidos</CardTitle>
              <CardDescription>Acompanhe o status de entrega e valores pagos.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por fornecedor..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchases.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-emerald-700">{order.id}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell className="text-muted-foreground">{order.date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-inner">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CalendarClock className="mr-2 h-5 w-5 text-emerald-600" />
              Próximas Entregas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">Hortifruti Central</span>
                <Badge variant="outline" className="text-xs">
                  Hoje, 14:00
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tomate, Cebola, Alho, Verduras diversas.
              </p>
              <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-emerald-600">
                Ver detalhes do pedido <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm">Laticínios Bom Campo</span>
                <Badge variant="outline" className="text-xs">
                  Amanhã
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Queijo Parmesão, Leite Integral.</p>
              <Button variant="link" size="sm" className="px-0 h-auto mt-2 text-emerald-600">
                Ver detalhes do pedido <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
