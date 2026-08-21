import { useState, useEffect } from 'react'
import {
  Wine,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  RefreshCw,
  Save,
  BarChart3,
  Layers,
} from 'lucide-react'
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
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { updateInventoryItem, type InventoryItem } from '@/services/inventory'
import { type SaleRecord } from '@/services/sales'
import { type MenuItem } from '@/services/menu-items'

interface DoseReportProps {
  inventory: InventoryItem[]
  sales: SaleRecord[]
  menuItems: MenuItem[]
  onRefresh: () => void
}

export function DoseReportPanel({ inventory, sales, menuItems, onRefresh }: DoseReportProps) {
  const { toast } = useToast()
  const [editingPhysicalStock, setEditingPhysicalStock] = useState<Record<string, number>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Filter liquids with dose / ml tracking
  const liquidItems = inventory.filter(
    (item) =>
      item.dose_padrao_ml ||
      item.volume_total_ml ||
      item.unit?.toLowerCase() === 'ml' ||
      item.category?.toLowerCase().includes('álcool') ||
      item.category?.toLowerCase().includes('bebida') ||
      item.category?.toLowerCase().includes('drink') ||
      item.category?.toLowerCase().includes('xarope'),
  )

  // Initialize physical stock state from inventory
  useEffect(() => {
    const initial: Record<string, number> = {}
    liquidItems.forEach((item) => {
      initial[item.id] = item.real_stock_ml !== undefined ? item.real_stock_ml : item.quantity
    })
    setEditingPhysicalStock(initial)
  }, [inventory])

  // Calculate doses served based on menu items sold that have this ingredient in recipe
  const calculateDosesServed = (invId: string) => {
    let totalMlServed = 0
    let totalDosesServed = 0

    sales.forEach((sale) => {
      const menuItem = menuItems.find((m) => m.id === sale.item_id)
      if (!menuItem || !menuItem.ingredients) return

      try {
        const ingredients = JSON.parse(menuItem.ingredients)
        if (!Array.isArray(ingredients)) return

        ingredients.forEach((ing) => {
          if (ing.inventory_id === invId) {
            const qtyPerPortion = ing.quantity || 0
            const totalMl = qtyPerPortion * (sale.quantity_sold || 1)
            totalMlServed += totalMl
          }
        })
      } catch {
        /* ignore parse error */
      }
    })

    const inv = inventory.find((i) => i.id === invId)
    const doseSize = inv?.dose_padrao_ml || 50
    totalDosesServed = Math.round((totalMlServed / doseSize) * 10) / 10

    return { totalMlServed, totalDosesServed }
  }

  const handleSaveRealStock = async (item: InventoryItem) => {
    const realValue = editingPhysicalStock[item.id]
    if (realValue === undefined || isNaN(realValue) || realValue < 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um volume válido em ml.',
        variant: 'destructive',
      })
      return
    }

    setSavingId(item.id)
    try {
      await updateInventoryItem(item.id, {
        real_stock_ml: realValue,
      })
      toast({
        title: 'Contagem física salva!',
        description: `${item.name}: Estoque real atualizado para ${realValue} ml.`,
      })
      onRefresh()
    } catch {
      toast({
        title: 'Erro ao salvar contagem física',
        variant: 'destructive',
      })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Wine className="h-5 w-5 text-indigo-600" /> Relatório de Doses & Auditoria de Bebidas
          </h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe doses servidas por garrafa, controle de ML e desvios entre estoque teórico vs
            contagem física real.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-1.5">
          <RefreshCw className="h-4 w-4" /> Atualizar Dados
        </Button>
      </div>

      {liquidItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Wine className="h-10 w-10 mx-auto opacity-40 mb-2" />
            <p className="font-semibold text-foreground">Nenhuma bebida com doses configurada</p>
            <p className="text-xs mt-1">
              Cadastre ingredientes de bar com unidade em ML e dose padrão no Estoque para auditar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">Auditoria de Garrafas & Doses</CardTitle>
                <CardDescription>
                  Alerta automático quando a diferença entre estoque teórico e físico for superior a
                  5%.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold">Bebida / Garrafa</TableHead>
                  <TableHead className="text-center">Dose Padrão</TableHead>
                  <TableHead className="text-center">Doses Servidas</TableHead>
                  <TableHead className="text-right">Estoque Teórico (Sistema)</TableHead>
                  <TableHead className="text-center w-[180px]">Estoque Real (Físico ml)</TableHead>
                  <TableHead className="text-center">Desvio (%)</TableHead>
                  <TableHead className="text-center">Status Auditoria</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liquidItems.map((item) => {
                  const doseSize = item.dose_padrao_ml || 50
                  const bottleSize = item.volume_total_ml || 1000
                  const theoreticalMl = item.quantity
                  const realMl =
                    editingPhysicalStock[item.id] !== undefined
                      ? editingPhysicalStock[item.id]
                      : item.real_stock_ml !== undefined
                        ? item.real_stock_ml
                        : theoreticalMl

                  const { totalMlServed, totalDosesServed } = calculateDosesServed(item.id)

                  // Remaining doses
                  const theoreticalDosesRemaining = Math.floor(theoreticalMl / doseSize)
                  const diffMl = theoreticalMl - realMl
                  const diffPercentage =
                    theoreticalMl > 0 ? (Math.abs(diffMl) / theoreticalMl) * 100 : 0
                  const hasSuspiciousDeviation = diffPercentage > 5 && Math.abs(diffMl) > 20

                  return (
                    <TableRow
                      key={item.id}
                      className={
                        hasSuspiciousDeviation
                          ? 'bg-red-50/60 dark:bg-red-950/20 hover:bg-red-50/90'
                          : ''
                      }
                    >
                      <TableCell className="font-semibold">
                        <div>
                          <span>{item.name}</span>
                          <span className="block text-xs font-normal text-muted-foreground">
                            {item.category} · Garrafa {bottleSize}ml
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-mono text-sm">
                        <Badge
                          variant="outline"
                          className="bg-indigo-50 text-indigo-700 border-indigo-200"
                        >
                          {doseSize} ml
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center font-mono">
                        <span className="font-bold text-foreground text-sm">
                          {totalDosesServed} doses
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          ({totalMlServed} ml)
                        </span>
                      </TableCell>

                      <TableCell className="text-right font-mono">
                        <span className="font-bold text-foreground">{theoreticalMl} ml</span>
                        <span className="block text-xs text-indigo-600 dark:text-indigo-400">
                          ~{theoreticalDosesRemaining} doses restando
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Input
                            type="number"
                            value={editingPhysicalStock[item.id] ?? ''}
                            onChange={(e) =>
                              setEditingPhysicalStock({
                                ...editingPhysicalStock,
                                [item.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            className={`h-8 w-24 text-center font-mono text-xs font-bold ${
                              hasSuspiciousDeviation
                                ? 'border-red-400 bg-red-50 dark:bg-red-950'
                                : ''
                            }`}
                          />
                          <span className="text-xs text-muted-foreground">ml</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-center font-mono">
                        {theoreticalMl > 0 ? (
                          <span
                            className={`font-bold text-xs px-2 py-0.5 rounded ${
                              hasSuspiciousDeviation
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {diffMl > 0
                              ? `-${diffPercentage.toFixed(1)}%`
                              : `+${diffPercentage.toFixed(1)}%`}{' '}
                            ({Math.abs(Math.round(diffMl))}ml)
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">0%</span>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        {hasSuspiciousDeviation ? (
                          <Badge className="bg-red-600 hover:bg-red-600 text-white gap-1 text-[11px] font-bold shadow-sm">
                            <AlertTriangle className="h-3 w-3" /> Alerta Desvio &gt; 5%
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 text-[11px]"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Conforme
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSaveRealStock(item)}
                          disabled={savingId === item.id}
                          className="h-8 text-xs gap-1 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                        >
                          <Save className="h-3.5 w-3.5" />
                          {savingId === item.id ? 'Salvando...' : 'Salvar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
