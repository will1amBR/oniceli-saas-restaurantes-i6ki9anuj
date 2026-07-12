import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { DollarSign, Trash2, PieChart } from 'lucide-react'
import { AiFinancialPanel } from '@/components/ai-financial-panel'

export default function Financial() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Análise Financeira</h1>
        <p className="text-muted-foreground mt-1">
          DRE gerencial, acompanhamento de custos e desperdícios.
        </p>
      </div>

      <AiFinancialPanel />

      <div className="grid gap-4 md:gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumo de Custos (Mês Atual)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Custo de Mercadoria (CMV)</p>
                    <p className="text-sm text-muted-foreground">
                      Ingredientes utilizados na produção
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono">R$ 12.450,00</p>
                  <p className="text-sm text-emerald-500">28.5% da Receita</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 md:p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Impacto de Desperdício</p>
                    <p className="text-sm text-muted-foreground">Vencimentos e erros de preparo</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold font-mono text-red-600">R$ 845,30</p>
                  <p className="text-sm text-red-500 font-medium">+15% vs Mês Anterior</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Distribuição de Custos
            </CardTitle>
            <CardDescription>Por categoria de ingrediente</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 rounded-full border-8 border-emerald-500 shadow-sm flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-amber-400 border-l-amber-400 -rotate-45" />
              <div className="text-center z-10">
                <span className="block text-2xl font-bold">100%</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>

            <div className="w-full space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Carnes/Peixes
                </span>
                <span className="font-medium">45%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-amber-400 mr-2"></span> Laticínios
                </span>
                <span className="font-medium">30%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-slate-300 mr-2"></span> Hortifruti
                </span>
                <span className="font-medium">25%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
