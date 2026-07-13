import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, Users, DollarSign, TrendingUp, Award, ArrowUpDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { getSupplierCrm, type ClientData } from '@/services/supplier-crm'
import { KPICard } from '@/components/kpi-card'
import { AbcCurve } from '@/components/abc-curve'
import { cn } from '@/lib/utils'

type SortField = 'totalRevenue' | 'totalOrders'

export default function SupplierClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<ClientData[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('totalRevenue')
  const [sortAsc, setSortAsc] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const data = await getSupplierCrm()
      setClients(data.clients)
      setTotalRevenue(data.totalRevenue)
      setTotalOrders(data.totalOrders)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('orders', () => loadData())

  if (!user) return null
  if (user.role !== 'supplier') return <Navigate to="/dashboard" replace />

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const sortedClients = [...clients].sort((a, b) => {
    const diff =
      sortField === 'totalRevenue' ? a.totalRevenue - b.totalRevenue : a.totalOrders - b.totalOrders
    return sortAsc ? diff : -diff
  })

  const avgRevenue = clients.length > 0 ? totalRevenue / clients.length : 0

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const categoryBadge = (cat: string) => {
    const config: Record<string, string> = {
      A: 'bg-emerald-500 text-white',
      B: 'bg-amber-500 text-white',
      C: 'bg-slate-400 text-white',
    }
    return config[cat] || config.C
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Meus Clientes (CRM)</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie relacionamento com restaurantes e analise a curva ABC de vendas.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total de Clientes"
          value={String(clients.length)}
          icon={Users}
          variant="default"
          subtitle="Restaurantes ativos"
        />
        <KPICard
          title="Receita Total"
          value={fmt(totalRevenue)}
          icon={DollarSign}
          variant="success"
          subtitle={`${totalOrders} pedidos no total`}
        />
        <KPICard
          title="Ticket Médio"
          value={fmt(avgRevenue)}
          icon={TrendingUp}
          variant="default"
          subtitle="Por cliente"
        />
        <KPICard
          title="Cliente Top (A)"
          value={clients.find((c) => c.category === 'A')?.name?.substring(0, 12) || '-'}
          icon={Award}
          variant="warning"
          subtitle={
            clients.find((c) => c.category === 'A')
              ? fmt(clients.find((c) => c.category === 'A')!.totalRevenue)
              : 'Sem dados'
          }
        />
      </div>

      <AbcCurve clients={clients} totalRevenue={totalRevenue} />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Ordenar por receita ou número de pedidos para identificar melhores clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Restaurante</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('totalOrders')}
                      >
                        Pedidos <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-medium"
                        onClick={() => handleSort('totalRevenue')}
                      >
                        Receita Total <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                    <TableHead>Último Pedido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Badge className={cn(categoryBadge(client.category))}>
                          {client.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {client.name}
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </TableCell>
                      <TableCell>{client.totalOrders}</TableCell>
                      <TableCell className="text-right font-mono">
                        {fmt(client.totalRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {client.revenuePercentage.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.lastOrderDate
                          ? new Date(client.lastOrderDate).toLocaleDateString('pt-BR')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
