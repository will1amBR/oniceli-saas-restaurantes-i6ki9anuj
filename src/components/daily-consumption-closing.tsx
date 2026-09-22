import { useState, useEffect } from 'react'
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Save,
  RotateCcw,
  Sparkles,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  HelpCircle,
  Check,
  Search,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  calculateTheoreticalDailyConsumption,
  saveAndReconcileDailyConsumption,
  type DailyConsumptionItem,
} from '@/services/daily-consumptions'
import { getInventory, type InventoryItem } from '@/services/inventory'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface DailyConsumptionClosingProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DailyConsumptionClosing({
  open,
  onOpenChange,
  onSuccess,
}: DailyConsumptionClosingProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [items, setItems] = useState<DailyConsumptionItem[]>([])
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [notes, setNotes] = useState('')

  // Modal para adicionar insumo avulso/desperdício não derivado de pedido
  const [addExtraModalOpen, setAddExtraModalOpen] = useState(false)
  const [extraSelectedInvId, setExtraSelectedInvId] = useState('')
  const [extraQuantity, setExtraQuantity] = useState(1)
  const [extraNotes, setExtraNotes] = useState('Perda avulsa / Vencimento no preparo')

  const loadData = async (dateToLoad: string) => {
    setLoading(true)
    try {
      const [result, allInv] = await Promise.all([
        calculateTheoreticalDailyConsumption(dateToLoad),
        getInventory().catch(() => [] as InventoryItem[]),
      ])
      setItems(result.items)
      setInventoryList(allInv)
    } catch (err) {
      toast({
        title: 'Erro ao carregar insumos do dia',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadData(selectedDate)
    }
  }, [open, selectedDate])

  // Ajustar quantidade real com stepper +/-
  const handleStepQuantity = (index: number, delta: number) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = updated[index]
      if (!current) return prev

      const step = current.unit === 'kg' || current.unit === 'L' ? 0.25 : 1
      const newReal = Math.max(0, Math.round((current.real_quantity + delta * step) * 1000) / 1000)
      const diff = Math.max(0, Math.round((newReal - current.theoretical_quantity) * 1000) / 1000)
      const loss = Math.round(diff * current.unit_cost * 100) / 100

      updated[index] = {
        ...current,
        real_quantity: newReal,
        difference_quantity: diff,
        divergence_cost: loss,
      }
      return updated
    })
  }

  // Ajustar manualmente no input
  const handleInputChange = (index: number, valueStr: string) => {
    const val = parseFloat(valueStr)
    const newReal = isNaN(val) || val < 0 ? 0 : Math.round(val * 1000) / 1000

    setItems((prev) => {
      const updated = [...prev]
      const current = updated[index]
      if (!current) return prev

      const diff = Math.max(0, Math.round((newReal - current.theoretical_quantity) * 1000) / 1000)
      const loss = Math.round(diff * current.unit_cost * 100) / 100

      updated[index] = {
        ...current,
        real_quantity: newReal,
        difference_quantity: diff,
        divergence_cost: loss,
      }
      return updated
    })
  }

  // Confirmar valor teórico como real
  const handleConfirmTheoretical = (index: number) => {
    setItems((prev) => {
      const updated = [...prev]
      const current = updated[index]
      if (!current) return prev

      updated[index] = {
        ...current,
        real_quantity: current.theoretical_quantity,
        difference_quantity: 0,
        divergence_cost: 0,
      }
      return updated
    })
  }

  // Adicionar item avulso
  const handleAddExtraItem = () => {
    if (!extraSelectedInvId) {
      toast({
        title: 'Selecione um insumo',
        description: 'Escolha qual ingrediente deseja adicionar ao fechamento.',
        variant: 'destructive',
      })
      return
    }

    const inv = inventoryList.find((i) => i.id === extraSelectedInvId)
    if (!inv) return

    // Verifica se já está na lista
    const existingIndex = items.findIndex((i) => i.inventory_id === inv.id)
    if (existingIndex >= 0) {
      // Atualiza o existente somando o avulso
      setItems((prev) => {
        const updated = [...prev]
        const current = updated[existingIndex]
        const newReal = current.real_quantity + extraQuantity
        const diff = Math.max(0, Math.round((newReal - current.theoretical_quantity) * 1000) / 1000)
        const loss = Math.round(diff * current.unit_cost * 100) / 100

        updated[existingIndex] = {
          ...current,
          real_quantity: newReal,
          difference_quantity: diff,
          divergence_cost: loss,
          notes: current.notes ? `${current.notes} | ${extraNotes}` : extraNotes,
        }
        return updated
      })
    } else {
      // Adiciona como novo item extra
      const unitCost = inv.unit_cost || 0
      const divergenceLoss = Math.round(extraQuantity * unitCost * 100) / 100
      const newItem: DailyConsumptionItem = {
        inventory_id: inv.id,
        name: inv.name,
        unit: inv.unit || 'un',
        category: inv.category || 'Avulso',
        unit_cost: unitCost,
        theoretical_quantity: 0, // Não teve pedido
        real_quantity: extraQuantity,
        difference_quantity: extraQuantity,
        divergence_cost: divergenceLoss,
        current_stock: inv.quantity || 0,
        is_extra: true,
        notes: extraNotes,
      }
      setItems((prev) => [newItem, ...prev])
    }

    setAddExtraModalOpen(false)
    setExtraSelectedInvId('')
    setExtraQuantity(1)
    toast({
      title: 'Insumo adicionado!',
      description: `${inv.name} adicionado com sucesso ao fechamento de hoje.`,
      className: 'bg-emerald-600 text-white font-bold',
    })
  }

  // Cálculos de Resumo
  const totalItemsCount = items.length
  const totalTheoreticalCost = items.reduce(
    (sum, it) => sum + it.theoretical_quantity * it.unit_cost,
    0,
  )
  const totalRealCost = items.reduce((sum, it) => sum + it.real_quantity * it.unit_cost, 0)
  const totalDivergenceCost = items.reduce((sum, it) => sum + (it.divergence_cost || 0), 0)

  // Maior desvio
  const itemsWithDivergence = items.filter((it) => it.difference_quantity > 0)
  const sortedByLoss = [...itemsWithDivergence].sort(
    (a, b) => (b.divergence_cost || 0) - (a.divergence_cost || 0),
  )
  const highestDivergence = sortedByLoss[0] || null

  // Filtragem de busca na lista
  const filteredItems = items.filter((it) => {
    if (!searchFilter) return true
    const q = searchFilter.toLowerCase()
    return it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
  })

  // Salvar e Reconciliar
  const handleSaveClosing = async () => {
    if (items.length === 0) {
      toast({
        title: 'Nenhum insumo',
        description: 'Não há insumos para fechar no momento.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await saveAndReconcileDailyConsumption({
        date: selectedDate,
        items,
        notes,
      })

      toast({
        title: 'Fechamento Diário Confirmado!',
        description: `Estoque reconciliado com sucesso! ${res.reconciledItemsCount} item(ns) ajustados com registro de perda de R$ ${res.totalDivergenceLoss.toFixed(2)}.`,
        className: 'bg-emerald-600 text-white font-bold',
      })

      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: 'Erro ao salvar fechamento',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Fechamento de Consumo Diário da Cozinha
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  Confirme o que foi consumido hoje, ajuste desvios reais e reconcilie o estoque.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono px-2.5 py-1 bg-muted/40">
                <Calendar className="h-3.5 w-3.5 mr-1 text-primary" />
                {selectedDate}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddExtraModalOpen(true)}
                className="font-bold text-xs rounded-xl h-9 gap-1.5 border-dashed border-amber-500/60 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
              >
                <Plus className="h-4 w-4" />+ Insumo Avulso / Perda
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Resumo do Dia no Topo (Touch-first KPI Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-2">
          {/* Card 1: Itens Monitorados */}
          <Card className="p-3 bg-muted/30 border border-border/70 rounded-xl shadow-none">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Total Insumos
            </p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-foreground">{totalItemsCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {itemsWithDivergence.length} com divergência
            </p>
          </Card>

          {/* Card 2: Consumo Teórico R$ */}
          <Card className="p-3 bg-muted/30 border border-border/70 rounded-xl shadow-none">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" /> Custo Teórico
            </p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-blue-700 dark:text-blue-400">
              R$ {totalTheoreticalCost.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Baixado nas comandas</p>
          </Card>

          {/* Card 3: Consumo Real R$ */}
          <Card className="p-3 bg-muted/30 border border-border/70 rounded-xl shadow-none">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> Custo Real
            </p>
            <p className="text-xl sm:text-2xl font-black mt-1 text-emerald-700 dark:text-emerald-400">
              R$ {totalRealCost.toFixed(2)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Reportado pela cozinha</p>
          </Card>

          {/* Card 4: Maior Desvio / Perda */}
          <Card
            className={`p-3 border rounded-xl shadow-none transition-colors ${
              totalDivergenceCost > 0
                ? 'bg-rose-500/10 border-rose-500/40'
                : 'bg-emerald-500/10 border-emerald-500/40'
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <AlertTriangle
                className={`h-3.5 w-3.5 ${totalDivergenceCost > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
              />
              Desvio Total
            </p>
            <p
              className={`text-xl sm:text-2xl font-black mt-1 ${
                totalDivergenceCost > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-emerald-700 dark:text-emerald-400'
              }`}
            >
              R$ {totalDivergenceCost.toFixed(2)}
            </p>
            <p className="text-[10px] truncate mt-0.5 text-muted-foreground">
              {highestDivergence
                ? `Maior: ${highestDivergence.name} (+${highestDivergence.difference_quantity} ${highestDivergence.unit})`
                : 'Sem desperdício registrado'}
            </p>
          </Card>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome do insumo (frango, salmão, tomate)..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 h-11 text-xs rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(selectedDate)}
            disabled={loading}
            className="h-11 px-3 rounded-xl shrink-0 font-bold text-xs gap-1.5"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalcular Teórico
          </Button>
        </div>

        {/* Lista de Insumos - Touch-first Tablet Cards (56px+ tap targets) */}
        <div className="space-y-3 pt-1">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              <RotateCcw className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-2" />
              <p className="font-bold text-sm">Calculando baixas de receitas do dia...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-2xl p-6 bg-muted/20">
              <Layers className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-black text-base">Nenhum insumo encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Não foram registrados pedidos concluídos para a data ou o filtro não retornou itens.
                Use o botão "+ Insumo Avulso" acima para registrar manualmente.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const originalIndex = items.findIndex((it) => it.inventory_id === item.inventory_id)
              const hasExcess = item.difference_quantity > 0
              const isMatch = item.real_quantity === item.theoretical_quantity

              return (
                <div
                  key={item.inventory_id}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    hasExcess
                      ? 'border-amber-400 bg-amber-500/[0.04] dark:bg-amber-950/20'
                      : isMatch
                        ? 'border-emerald-500/50 bg-emerald-500/[0.03] dark:bg-emerald-950/15'
                        : 'border-border bg-card'
                  }`}
                >
                  {/* Item Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base sm:text-lg text-foreground tracking-tight">
                        {item.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase px-1.5">
                        {item.unit}
                      </Badge>
                      {item.is_extra && (
                        <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                          Avulso / Perda
                        </Badge>
                      )}
                      {hasExcess && (
                        <Badge className="bg-amber-600 text-white text-[10px] font-bold">
                          +{item.difference_quantity} {item.unit} acima (Desvio)
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>
                        Teórico comanda:{' '}
                        <strong className="text-foreground">
                          {item.theoretical_quantity} {item.unit}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Custo unitário: R$ {item.unit_cost.toFixed(2)}/{item.unit}
                      </span>
                      {hasExcess && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            Perda financeira: R$ {item.divergence_cost.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Touch Stepper & Actions (Min 56px height for Chef taps) */}
                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    <div className="flex items-center bg-background border-2 rounded-xl p-1 shadow-2xs">
                      {/* Botão Menos (-) Touch 56px */}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleStepQuantity(originalIndex, -1)}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg p-0 font-black text-xl hover:bg-muted active:scale-95"
                      >
                        <Minus className="h-5 w-5" />
                      </Button>

                      {/* Input de Quantidade Real */}
                      <div className="px-2 text-center">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.real_quantity}
                          onChange={(e) => handleInputChange(originalIndex, e.target.value)}
                          className="w-20 sm:w-24 text-center font-black text-lg sm:text-xl h-11 border-none focus-visible:ring-0 p-0"
                        />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block -mt-1">
                          {item.unit} Real
                        </span>
                      </div>

                      {/* Botão Mais (+) Touch 56px */}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleStepQuantity(originalIndex, 1)}
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg p-0 font-black text-xl hover:bg-muted active:scale-95 text-amber-600"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Botão Confere / Teórico (Iguala ao teórico em 1 toque) */}
                    <Button
                      type="button"
                      variant="outline"
                      title="Confirmar que o consumo real foi igual ao teórico"
                      onClick={() => handleConfirmTheoretical(originalIndex)}
                      className={`h-14 px-3 rounded-xl font-bold text-xs gap-1.5 border-2 min-h-[56px] ${
                        isMatch
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="hidden sm:inline">Bateu Teórico</span>
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Observações do Turno */}
        <div className="pt-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Observações do Turno / Justificativa de Perdas:
          </label>
          <Textarea
            placeholder="Ex: Queima de 0,5kg de frango por fogo alto, quebra de 2 ovos no preparo da Caesar..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="rounded-xl min-h-[70px] text-xs resize-none"
          />
        </div>

        {/* Footer Actions */}
        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-12 sm:h-14 rounded-xl font-bold text-xs px-5 min-h-[48px]"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSaveClosing}
            disabled={saving || items.length === 0}
            className="h-12 sm:h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base px-6 gap-2 min-h-[56px] shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all"
          >
            {saving ? (
              <>
                <RotateCcw className="h-5 w-5 animate-spin" />
                <span>Reconciliando Estoque...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Confirmar Fechamento e Ajustar Estoque</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal Secundário: Adicionar Insumo Avulso */}
      <Dialog open={addExtraModalOpen} onOpenChange={setAddExtraModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              Registrar Insumo Avulso / Desperdício
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione insumos que foram descartados ou consumidos fora dos pratos registrados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold block mb-1">Selecione o Ingrediente:</label>
              <select
                value={extraSelectedInvId}
                onChange={(e) => setExtraSelectedInvId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border bg-background text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione um ingrediente do estoque...</option>
                {inventoryList.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name} ({inv.unit}) — Saldo atual: {inv.quantity} {inv.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold block mb-1">Qtd Desperdiçada/Gasta:</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={extraQuantity}
                  onChange={(e) => setExtraQuantity(parseFloat(e.target.value) || 0)}
                  className="h-11 rounded-xl text-center font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Motivo Principal:</label>
                <select
                  value={extraNotes}
                  onChange={(e) => setExtraNotes(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Perda avulsa / Vencimento no preparo">Perda no Preparo</option>
                  <option value="Queima / Erro de Cozimento">Queima / Erro</option>
                  <option value="Validade Vencida na Geladeira">Validade Vencida</option>
                  <option value="Deterioração / Queda">Deterioração / Queda</option>
                  <option value="Consumo de Prova / Degustação">Degustação / Teste</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddExtraModalOpen(false)}
              className="rounded-xl h-11 text-xs"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleAddExtraItem}
              className="rounded-xl h-11 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              Adicionar ao Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
