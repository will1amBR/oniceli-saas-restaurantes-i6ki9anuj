import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts'

const mockSalesData = [
  { day: 'Seg', vendas: 120 },
  { day: 'Ter', vendas: 150 },
  { day: 'Qua', vendas: 180 },
  { day: 'Qui', vendas: 220 },
  { day: 'Sex', vendas: 350 },
  { day: 'Sab', vendas: 450 },
  { day: 'Dom', vendas: 380 },
]

export default function Sales() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
        <p className="text-muted-foreground mt-1">Análise de pratos mais vendidos e tendências.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Desempenho Semanal</CardTitle>
            <CardDescription>Volume de pedidos por dia da semana</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockSalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pratos (Mais Rentáveis)</CardTitle>
            <CardDescription>Baseado no CMV e volume de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: 'Risoto de Funghi', margin: '72%', vol: 145 },
                { name: 'Salmão Grelhado', margin: '68%', vol: 112 },
                { name: 'Torta de Morango', margin: '70%', vol: 89 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.vol} pedidos este mês</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-emerald-600">{item.margin}</p>
                    <p className="text-xs text-muted-foreground">Margem</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
