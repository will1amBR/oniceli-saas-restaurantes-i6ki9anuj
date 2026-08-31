import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  TrendingDown,
  Sparkles,
  Layers,
  Clock,
  PiggyBank,
  CheckCircle2,
  ChevronRight,
  PlusCircle,
  Truck,
  Package,
  Loader2,
  Percent,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  getActiveCampaigns,
  getCollectiveOrdersForRestaurant,
  calculateMonthlySavings,
  joinCollectiveCampaign,
  type CollectiveCampaign,
  type CollectiveOrder,
  type CollectiveSavingsSummary,
} from '@/services/collective-purchases'
import { cn } from '@/lib/utils'

export function CollectivePurchasesPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<CollectiveCampaign[]>([])
  const [userOrders, setUserOrders] = useState<CollectiveOrder[]>([])
  const [savings, setSavings] = useState<CollectiveSavingsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal de Adesão
  const [selectedCampaign, setSelectedCampaign] = useState<CollectiveCampaign | null>(null)
  const [joinQuantity, setJoinQuantity] = useState<number>(10)
  const [joinNotes, setJoinNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [camps, ords, sav] = await Promise.all([
        getActiveCampaigns(),
        getCollectiveOrdersForRestaurant(user.id),
        calculateMonthlySavings(user.id),
      ])
      setCampaigns(camps)
      setUserOrders(ords)
      setSavings(sav)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenJoin = (campaign: CollectiveCampaign) => {
    setSelectedCampaign(campaign)
    setJoinQuantity(campaign.min_order_per_restaurant || 10)
    setJoinNotes('')
  }

  const handleConfirmJoin = async () => {
    if (!selectedCampaign || !user?.id) return
    if (joinQuantity < (selectedCampaign.min_order_per_restaurant || 1)) {
      toast({
        title: 'Quantidade abaixo do mínimo',
        description: `O pedido mínimo para esta campanha é ${selectedCampaign.min_order_per_restaurant} ${selectedCampaign.unit}.`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await joinCollectiveCampaign({
        campaignId: selectedCampaign.id,
        restaurantId: user.id,
        quantity: joinQuantity,
        notes: joinNotes,
      })

      const estimatedSaved =
        joinQuantity *
        (selectedCampaign.regular_unit_price - selectedCampaign.collective_unit_price)

      toast({
        title: '🎉 Adesão Confirmada!',
        description: `Você aderiu com ${joinQuantity} ${selectedCampaign.unit}. Economia estimada de R$ ${estimatedSaved.toFixed(2)} ao fechar o lote!`,
      })

      setSelectedCampaign(null)
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao aderir',
        description: err?.message || 'Não foi possível registrar seu pedido coletivo.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 1. Resumo / Card de Economia Mensal */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg border-none relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-15">
            <PiggyBank className="w-32 h-32" />
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Economia Mensal Total
              </span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                2026
              </span>
            </div>
            <CardTitle className="text-3xl font-black text-white mt-1">
              R${' '}
              {(savings?.totalSaved || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-emerald-100 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              Economia média de {(savings?.savingsPercentage || 0).toFixed(1)}% nas compras
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Total Investido em Lotes
            </span>
            <CardTitle className="text-2xl font-bold">
              R${' '}
              {(savings?.totalSpent || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {savings?.ordersCount || 0} pedidos consolidados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Campanhas Ativas
            </span>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              {campaigns.length}
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-none text-xs">
                Abertas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Preços com até 25% de desconto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Insumos no Pool Coletivo
            </span>
            <CardTitle className="text-2xl font-bold">
              {savings?.itemsBreakdown?.length || 0} itens
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Reposição inteligente ativa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Campanhas Coletivas Abertas para Adesão */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Lotes e Compras Coletivas Ativas (2026)
            </h2>
            <p className="text-sm text-muted-foreground">
              Junte a demanda do seu restaurante com outros parceiros e pague preço de atacado
              direto com fornecedores homologados.
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground text-sm">
              Nenhuma compra coletiva aberta neste momento. Novas campanhas são abertas
              semanalmente.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((camp) => {
              const current = camp.current_quantity || 0
              const target = camp.target_quantity || 100
              const pct = Math.min(100, Math.round((current / target) * 100))
              const discountPct = Math.round(
                ((camp.regular_unit_price - camp.collective_unit_price) / camp.regular_unit_price) *
                  100,
              )
              const supplierName = camp.expand?.supplier_id?.name || 'Fornecedor Homologado'
              const deadlineDate = new Date(camp.deadline).toLocaleDateString('pt-BR')

              return (
                <Card
                  key={camp.id}
                  className="flex flex-col justify-between hover:shadow-md transition-shadow border-border/80"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                      >
                        {camp.category || 'Geral'}
                      </Badge>
                      <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs">
                        <Percent className="h-3 w-3 mr-0.5" /> -{discountPct}% OFF
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold line-clamp-1 mt-2">
                      {camp.title}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {camp.description || 'Pool de compras coletivas com entrega garantida.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-0 flex-1 flex flex-col justify-end">
                    {/* Preços comparativos */}
                    <div className="bg-muted/40 p-3 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-muted-foreground line-through block">
                          De R$ {camp.regular_unit_price.toFixed(2)}/{camp.unit}
                        </span>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                          R$ {camp.collective_unit_price.toFixed(2)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{camp.unit}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">
                          Economia por {camp.unit}
                        </span>
                        <span className="text-xs font-bold text-emerald-600">
                          + R$ {(camp.regular_unit_price - camp.collective_unit_price).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso da Meta do Lote */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">Meta do lote</span>
                        <span className="font-bold text-foreground">
                          {current} / {target} {camp.unit} ({pct}%)
                        </span>
                      </div>
                      <Progress value={pct} className="h-2 bg-muted" />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" /> {supplierName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Encerra {deadlineDate}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleOpenJoin(camp)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
                      size="sm"
                    >
                      <PlusCircle className="mr-1.5 h-4 w-4" /> Aderir à Compra Coletiva
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Minhas Adesões e Histórico de Economia */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              Minhas Participações em Compras Coletivas
            </CardTitle>
            <CardDescription className="text-xs">
              Acompanhe o status de confirmação e a entrega dos lotes aos quais você aderiu.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {userOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">
                  Você ainda não aderiu a nenhuma compra coletiva. Escolha um lote acima para
                  começar a economizar.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userOrders.map((ord) => {
                  const camp = ord.expand?.campaign_id
                  const itemName = camp?.item_name || 'Insumo'
                  const unit = camp?.unit || 'un'
                  const supplier = camp?.expand?.supplier_id?.name || 'Fornecedor'

                  return (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-sm">{itemName}</span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold"
                          >
                            {ord.quantity} {unit}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              ord.status === 'confirmed'
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-amber-500 text-amber-600',
                            )}
                          >
                            {ord.status === 'confirmed' ? 'Confirmado' : 'Aderido'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Fornecedor: {supplier}</span>
                          <span>•</span>
                          <span>
                            Total: R${' '}
                            {(ord.total_cost || 0).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] text-muted-foreground block">
                          Economia no lote
                        </span>
                        <span className="text-sm font-bold text-emerald-600">
                          + R${' '}
                          {(ord.estimated_savings || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Resumo de Recompra por Insumo */}
        <Card className="bg-slate-50 dark:bg-slate-900/60 border-none shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Economia por Mantimento
            </CardTitle>
            <CardDescription className="text-xs">
              Consolidação de economia acumulada neste mês de 2026.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {!savings?.itemsBreakdown || savings.itemsBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                Nenhum insumo consolidado ainda.
              </p>
            ) : (
              savings.itemsBreakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-950 p-3 rounded-lg border shadow-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-xs text-foreground">{item.itemName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.quantity} {item.unit} comprados
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 block">
                      + R$ {item.saved.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">economizados</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Dialog para Adesão à Compra Coletiva */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Aderir ao Lote Coletivo
                </DialogTitle>
                <DialogDescription>
                  {selectedCampaign.title} · Fornecedor homologado com desconto em escala.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Quadro de Valores */}
                <div className="bg-muted/50 p-3.5 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço normal de balcão:</span>
                    <span className="line-through">
                      R$ {selectedCampaign.regular_unit_price.toFixed(2)}/{selectedCampaign.unit}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600">
                    <span>Preço no lote coletivo:</span>
                    <span>
                      R$ {selectedCampaign.collective_unit_price.toFixed(2)}/{selectedCampaign.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
                    <span>Pedido mínimo:</span>
                    <span>
                      {selectedCampaign.min_order_per_restaurant} {selectedCampaign.unit}
                    </span>
                  </div>
                </div>

                {/* Input de Quantidade */}
                <div className="space-y-1.5">
                  <Label htmlFor="qty" className="text-xs font-semibold">
                    Quantidade desejada ({selectedCampaign.unit})
                  </Label>
                  <Input
                    id="qty"
                    type="number"
                    min={selectedCampaign.min_order_per_restaurant || 1}
                    value={joinQuantity}
                    onChange={(e) => setJoinQuantity(Number(e.target.value))}
                    className="font-bold text-base"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-semibold">
                    Instruções de Entrega / Observações (opcional)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Ex.: Entregar no período da manhã, preferência por corte fino..."
                    rows={2}
                    value={joinNotes}
                    onChange={(e) => setJoinNotes(e.target.value)}
                  />
                </div>

                {/* Simulação de Economia */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-emerald-800 dark:text-emerald-200 font-bold block">
                      Total do Pedido: R${' '}
                      {(joinQuantity * selectedCampaign.collective_unit_price).toFixed(2)}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Preço sem lote: R${' '}
                      {(joinQuantity * selectedCampaign.regular_unit_price).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block">
                      Sua Economia:
                    </span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300">
                      R${' '}
                      {(
                        joinQuantity *
                        (selectedCampaign.regular_unit_price -
                          selectedCampaign.collective_unit_price)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCampaign(null)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmJoin}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Participação
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
