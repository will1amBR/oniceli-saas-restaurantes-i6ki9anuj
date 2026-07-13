import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ClientData } from '@/services/supplier-crm'
import type { ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  revenue: { label: 'Receita', color: 'hsl(var(--primary))' },
} satisfies ChartConfig

const categoryColors: Record<string, string> = {
  A: '#10b981',
  B: '#f59e0b',
  C: '#94a3b8',
}

const categoryLabels: Record<string, string> = {
  A: 'Categoria A',
  B: 'Categoria B',
  C: 'Categoria C',
}

interface Props {
  clients: ClientData[]
  totalRevenue: number
}

export function AbcCurve({ clients, totalRevenue }: Props) {
  const chartData = clients.map((c) => ({
    name: c.name.length > 15 ? c.name.substring(0, 15) + '…' : c.name,
    fullName: c.name,
    revenue: c.totalRevenue,
    category: c.category,
    percentage: c.revenuePercentage,
  }))

  const categoryA = clients.filter((c) => c.category === 'A')
  const categoryB = clients.filter((c) => c.category === 'B')
  const categoryC = clients.filter((c) => c.category === 'C')

  const revA = categoryA.reduce((s, c) => s + c.totalRevenue, 0)
  const revB = categoryB.reduce((s, c) => s + c.totalRevenue, 0)
  const revC = categoryC.reduce((s, c) => s + c.totalRevenue, 0)

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-emerald-500 text-white">A</Badge>
              <span className="text-xs text-muted-foreground">
                {totalRevenue > 0 ? ((revA / totalRevenue) * 100).toFixed(1) : 0}% da receita
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{fmt(revA)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {categoryA.length} cliente(s) · Topo (70-80%)
            </p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-amber-500 text-white">B</Badge>
              <span className="text-xs text-muted-foreground">
                {totalRevenue > 0 ? ((revB / totalRevenue) * 100).toFixed(1) : 0}% da receita
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{fmt(revB)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {categoryB.length} cliente(s) · Intermediário (15-20%)
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-slate-400 text-white">C</Badge>
              <span className="text-xs text-muted-foreground">
                {totalRevenue > 0 ? ((revC / totalRevenue) * 100).toFixed(1) : 0}% da receita
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-600">{fmt(revC)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {categoryC.length} cliente(s) · Base (~5%)
            </p>
          </CardContent>
        </Card>
      </div>

      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Curva ABC — Receita por Cliente</CardTitle>
            <CardDescription>Classificação por contribuição no faturamento total</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, _name, item) => {
                        const data = item.payload
                        return (
                          <div className="space-y-1">
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm">Receita: {fmt(Number(value))}</p>
                            <p className="text-xs text-muted-foreground">
                              {data.percentage.toFixed(1)}% do total · Categoria {data.category}
                            </p>
                          </div>
                        )
                      }}
                    />
                  }
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={categoryColors[entry.category]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
