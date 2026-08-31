import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  Building2,
  BellRing,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Mail,
  MessageSquare,
  CheckCircle2,
  Users,
  Send,
  Plus,
  ArrowUpRight,
  Sparkles,
  Loader2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  getBpoClients,
  getBpoStockAlerts,
  triggerBpoReorderAlert,
  createBpoClient,
  type BpoClient,
  type BpoReorderAlertItem,
} from '@/services/bpo'
import { getActiveCampaigns, type CollectiveCampaign } from '@/services/collective-purchases'
import { buildWhatsAppUrl } from '@/lib/whatsapp'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export default function BpoDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [clients, setClients] = useState<BpoClient[]>([])
  const [alerts, setAlerts] = useState<BpoReorderAlertItem[]>([])
  const [campaigns, setCampaigns] = useState<CollectiveCampaign[]>([])
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Disparo de notificação multicanal
  const [selectedAlert, setSelectedAlert] = useState<BpoReorderAlertItem | null>(null)
  const [dispatchChannel, setDispatchChannel] = useState<'all' | 'internal' | 'email' | 'whatsapp'>(
    'all',
  )
  const [dispatchNotes, setDispatchNotes] = useState('')
  const [dispatching, setDispatching] = useState(false)

  // Modal de Adicionar Novo Restaurante Cliente
  const [showAddClient, setShowAddClient] = useState(false)
  const [newClient, setNewClient] = useState({
    restaurant_id: '',
    plan_name: 'Plano Pro 2026',
    monthly_fee: 890,
    commission_rate: 15,
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    notes: '',
  })
  const [savingClient, setSavingClient] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const [cls, alts, camps, usrs] = await Promise.all([
        getBpoClients(user.id),
        getBpoStockAlerts(user.id),
        getActiveCampaigns(),
        pb.collection('users').getFullList({ filter: 'role = "restaurant"' }),
      ])
      setClients(cls)
      setAlerts(alts)
      setCampaigns(camps)
      setAllUsers(usrs.map((u: any) => ({ id: u.id, name: u.name, email: u.email })))
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  // KPIs
  const totalMrr = clients.reduce((acc, c) => acc + (c.monthly_fee || 0), 0)
  const totalCommission = clients.reduce(
    (acc, c) => acc + ((c.monthly_fee || 0) * (c.commission_rate || 0)) / 100,
    0,
  )
  const criticalCount = alerts.filter((a) => a.urgency === 'critical').length

  const handleOpenDispatch = (alertItem: BpoReorderAlertItem) => {
    setSelectedAlert(alertItem)
    setDispatchChannel('all')
    setDispatchNotes(
      `Recompra de ${alertItem.itemName} sugerida. Incluir na Compra Coletiva 2026 com preço de atacado.`,
    )
  }

  const handleSendNotification = async () => {
    if (!selectedAlert || !user?.id) return
    setDispatching(true)
    try {
      const result = await triggerBpoReorderAlert({
        restaurantId: selectedAlert.restaurantId,
        itemId: selectedAlert.id,
        channel: dispatchChannel,
        notes: dispatchNotes,
      })

      // Se canal whatsapp selecionado ou all, abre link
      if (dispatchChannel === 'whatsapp' || dispatchChannel === 'all') {
        const phone = selectedAlert.restaurantPhone || ''
        const waMsg =
          `🚨 *[Oniceli BPO 2026] Alerta de Recompra*\n\n` +
          `Olá *${selectedAlert.restaurantName}*!\n` +
          `Identificamos que seu estoque de *${selectedAlert.itemName}* atingiu o nível crítico (${selectedAlert.currentQuantity} ${selectedAlert.unit} restantes / Mínimo: ${selectedAlert.minStock} ${selectedAlert.unit}).\n\n` +
          `💡 *Sugestão BPO:* ${dispatchNotes}\n` +
          `Acesse o Oniceli para confirmar a compra coletiva e economizar até 25% no fechamento do mês.`

        if (phone) {
          const waUrl = buildWhatsAppUrl(phone, waMsg)
          window.open(waUrl, '_blank')
        }
      }

      toast({
        title: '✅ Notificação Disparada!',
        description: `Alerta enviado com sucesso nos canais selecionados (${dispatchChannel.toUpperCase()}).`,
      })

      setSelectedAlert(null)
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao disparar',
        description: err?.message || 'Falha no envio da notificação de recompra.',
        variant: 'destructive',
      })
    } finally {
      setDispatching(false)
    }
  }

  const handleCreateClient = async () => {
    if (!user?.id || !newClient.restaurant_id) {
      toast({
        title: 'Selecione um restaurante',
        description: 'É necessário selecionar o restaurante cliente.',
        variant: 'destructive',
      })
      return
    }

    setSavingClient(true)
    try {
      await createBpoClient({
        ...newClient,
        bpo_user_id: user.id,
        status: 'active',
        auto_reorder_alert: true,
        whatsapp_notifications: true,
        email_notifications: true,
      })

      toast({
        title: 'Restaurante Vinculado!',
        description: 'O cliente foi adicionado à sua carteira BPO 2026 com sucesso.',
      })

      setShowAddClient(false)
      setNewClient({
        restaurant_id: '',
        plan_name: 'Plano Pro 2026',
        monthly_fee: 890,
        commission_rate: 15,
        contact_person: '',
        contact_phone: '',
        contact_email: '',
        notes: '',
      })
      await loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao vincular',
        description: err?.message || 'Não foi possível salvar o cliente.',
        variant: 'destructive',
      })
    } finally {
      setSavingClient(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header do Módulo BPO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Painel do Parceiro BPO
            </h1>
            <Badge className="bg-teal-600 text-white font-bold text-xs uppercase">
              Revenda & Gestão 2026
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie seus clientes restaurantes, monitore reposição de mantimentos e dispare alertas
            multicanal (Sistema, E-mail e WhatsApp).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddClient(true)}
            className="bg-teal-600 hover:bg-teal-700 font-semibold"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Vincular Novo Restaurante
          </Button>
        </div>
      </div>

      {/* Grid de KPIs BPO */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-teal-700 to-emerald-800 text-white shadow-md border-none">
          <CardHeader className="pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-100">
              MRR sob Gestão (2026)
            </span>
            <CardTitle className="text-3xl font-black mt-1">
              R${' '}
              {totalMrr.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-teal-100 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> {clients.length} restaurantes na carteira
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Sua Comissão Mensal Estimada
            </span>
            <CardTitle className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              R${' '}
              {totalCommission.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Repasse médio de 15% a 20% / mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Alertas de Recompra Críticos
            </span>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              {criticalCount}
              {criticalCount > 0 ? (
                <Badge variant="destructive" className="text-xs font-bold">
                  Ação Necessária
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs font-bold">
                  Estável
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Itens abaixo do estoque mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase">
              Canais de Disparo Ativos
            </span>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">3 Canais</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-1.5 pt-0.5">
              <Badge variant="secondary" className="text-[10px] py-0">
                In-App
              </Badge>
              <Badge variant="secondary" className="text-[10px] py-0">
                E-mail
              </Badge>
              <Badge
                variant="secondary"
                className="text-[10px] py-0 text-green-700 bg-green-50 border-green-200"
              >
                WhatsApp
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas do Módulo BPO */}
      <Tabs defaultValue="reorders" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="reorders" className="gap-2 font-semibold">
            <BellRing className="h-4 w-4 text-teal-600" />
            Central de Recompra ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2 font-semibold">
            <Building2 className="h-4 w-4" />
            Restaurantes Clientes ({clients.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Central de Recompra e Alertas Multicanal */}
        <TabsContent value="reorders" className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    Monitoramento de Estoque & Sugestão de Recompra de Mantimentos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Detecta automaticamente quando o estoque de um cliente atinge o nível mínimo ou
                    o lead time de entrega exige reposição.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadData}
                  className="text-xs self-start sm:self-auto"
                >
                  Atualizar Varredura
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                  <h3 className="text-base font-semibold">Tudo sob controle!</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    Nenhum cliente com estoque crítico ou necessidade de reposição imediata neste
                    momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alt) => (
                    <div
                      key={alt.id}
                      className={cn(
                        'p-4 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all',
                        alt.urgency === 'critical'
                          ? 'border-red-200 bg-red-50/40 dark:bg-red-950/20'
                          : 'border-amber-200 bg-amber-50/40 dark:bg-amber-950/20',
                      )}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {alt.restaurantName}
                          </span>
                          <Badge
                            variant={alt.urgency === 'critical' ? 'destructive' : 'outline'}
                            className="text-[10px] font-bold"
                          >
                            {alt.urgency === 'critical' ? 'Estoque Crítico' : 'Reposição Sugerida'}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {alt.category}
                          </Badge>
                        </div>

                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            <strong>Insumo:</strong> {alt.itemName}
                          </span>
                          <span>
                            <strong>Estoque Atual:</strong>{' '}
                            <span className="font-bold text-red-600">
                              {alt.currentQuantity} {alt.unit}
                            </span>
                          </span>
                          <span>
                            <strong>Mínimo:</strong> {alt.minStock} {alt.unit}
                          </span>
                          <span>
                            <strong>Lead Time:</strong> {alt.leadTime || 2} dias
                          </span>
                          {alt.restaurantPhone && (
                            <span>
                              <strong>Tel/WhatsApp:</strong> {alt.restaurantPhone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleOpenDispatch(alt)}
                          className="bg-teal-600 hover:bg-teal-700 text-xs font-semibold"
                        >
                          <Send className="mr-1.5 h-3.5 w-3.5" /> Disparar Alerta Multicanal
                        </Button>
                        <Button size="sm" variant="outline" asChild className="text-xs">
                          <Link to="/compras">
                            <ShoppingBag className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                            Lote Coletivo
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Lista de Restaurantes Clientes */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-teal-600" />
                    Carteira de Restaurantes Vinculados
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Empresas que utilizam o Oniceli através da sua parceria de revenda e BPO.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddClient(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-xs font-semibold"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar Restaurante
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {clients.length === 0 ? (
                <div className="text-center py-10">
                  <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum restaurante cliente vinculado ainda. Clique em "Adicionar Restaurante"
                    para começar.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {clients.map((cli) => {
                    const restName = cli.expand?.restaurant_id?.name || 'Restaurante'
                    const restEmail = cli.contact_email || cli.expand?.restaurant_id?.email || 'N/A'
                    const restPhone = cli.contact_phone || cli.expand?.restaurant_id?.phone || 'N/A'

                    return (
                      <Card
                        key={cli.id}
                        className="p-4 flex flex-col justify-between hover:border-teal-400 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-base leading-tight">{restName}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{restEmail}</p>
                            </div>
                            <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-none text-[10px] font-bold uppercase">
                              {cli.status === 'active' ? 'Ativo' : cli.status}
                            </Badge>
                          </div>

                          <div className="bg-muted/40 p-2.5 rounded-lg text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Plano Contratado:</span>
                              <span className="font-semibold">{cli.plan_name || 'Plano Pro'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Mensalidade:</span>
                              <span className="font-semibold">
                                R$ {(cli.monthly_fee || 0).toFixed(2)}/mês
                              </span>
                            </div>
                            <div className="flex justify-between text-teal-600 font-bold">
                              <span>Comissão BPO ({cli.commission_rate || 15}%):</span>
                              <span>
                                R${' '}
                                {(
                                  ((cli.monthly_fee || 0) * (cli.commission_rate || 15)) /
                                  100
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p>
                              <strong>Contato:</strong> {cli.contact_person || 'Responsável'}
                            </p>
                            <p>
                              <strong>Telefone/WA:</strong> {restPhone}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t mt-3 flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px] text-teal-700 bg-teal-50">
                            Auto Recompra ON
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-teal-600 hover:text-teal-700 h-7 px-2"
                            onClick={() => {
                              if (restPhone && restPhone !== 'N/A') {
                                const url = buildWhatsAppUrl(
                                  restPhone,
                                  `Olá ${restName}, aqui é da equipe BPO Oniceli! Como podemos ajudar na gestão da sua operação hoje?`,
                                )
                                window.open(url, '_blank')
                              } else {
                                toast({
                                  title: 'Telefone não cadastrado',
                                  description:
                                    'Cadastre o WhatsApp do cliente para contato direto.',
                                })
                              }
                            }}
                          >
                            <MessageSquare className="mr-1 h-3.5 w-3.5 text-green-600" /> WhatsApp
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE DISPARO MULTICANAL DE RECOMPRA */}
      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Send className="h-5 w-5 text-teal-600" />
                  Disparar Alerta de Recompra Multicanal
                </DialogTitle>
                <DialogDescription>
                  Notifique o restaurante e registre no painel do parceiro BPO em tempo real.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Detalhes do Alerta */}
                <div className="bg-muted/50 p-3.5 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Restaurante:</span>
                    <span className="font-bold text-foreground">
                      {selectedAlert.restaurantName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Insumo em Baixa:</span>
                    <span className="font-bold text-red-600">
                      {selectedAlert.itemName} ({selectedAlert.currentQuantity} {selectedAlert.unit}{' '}
                      restantes / Mín: {selectedAlert.minStock} {selectedAlert.unit})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Telefone/WhatsApp:</span>
                    <span>{selectedAlert.restaurantPhone || '(11) 98765-4321'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">E-mail:</span>
                    <span>{selectedAlert.restaurantEmail || 'cliente@oniceli.com'}</span>
                  </div>
                </div>

                {/* Seleção de Canal */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Canais de Notificação</Label>
                  <Select
                    value={dispatchChannel}
                    onValueChange={(val: any) => setDispatchChannel(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione os canais" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        🚀 Todos os Canais (Sistema + E-mail + WhatsApp)
                      </SelectItem>
                      <SelectItem value="whatsapp">💬 Apenas WhatsApp</SelectItem>
                      <SelectItem value="email">✉️ Apenas E-mail Transacional</SelectItem>
                      <SelectItem value="internal">
                        🖥️ Apenas No Próprio Sistema (In-App)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mensagem / Orientação BPO */}
                <div className="space-y-1.5">
                  <Label htmlFor="dispatch-notes" className="text-xs font-semibold">
                    Orientação do Parceiro BPO / Mensagem Adicional
                  </Label>
                  <Textarea
                    id="dispatch-notes"
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    rows={3}
                    placeholder="Instruções para o cliente confirmar o pedido coletivo..."
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAlert(null)}
                  disabled={dispatching}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSendNotification}
                  disabled={dispatching}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  {dispatching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Disparar Agora
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL PARA VINCULAR NOVO RESTAURANTE CLIENTE */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-teal-600" />
              Vincular Restaurante à Carteira BPO
            </DialogTitle>
            <DialogDescription>
              Cadastre novos clientes atendidos pela sua consultoria BPO em 2026.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Restaurante</Label>
              <Select
                value={newClient.restaurant_id}
                onValueChange={(val) => {
                  const u = allUsers.find((x) => x.id === val)
                  setNewClient((prev) => ({
                    ...prev,
                    restaurant_id: val,
                    contact_email: u?.email || '',
                    contact_person: u?.name || '',
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o restaurante cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Plano</Label>
                <Select
                  value={newClient.plan_name}
                  onValueChange={(val) => setNewClient((prev) => ({ ...prev, plan_name: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plano Lite 2026">Plano Lite (R$ 450)</SelectItem>
                    <SelectItem value="Plano Pro 2026">Plano Pro (R$ 890)</SelectItem>
                    <SelectItem value="Plano Enterprise 2026">Enterprise (R$ 2.200)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Comissão BPO (%)</Label>
                <Input
                  type="number"
                  value={newClient.commission_rate}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, commission_rate: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Responsável / Contato</Label>
              <Input
                value={newClient.contact_person}
                onChange={(e) =>
                  setNewClient((prev) => ({ ...prev, contact_person: e.target.value }))
                }
                placeholder="Nome do gerente ou proprietário"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp para Alertas</Label>
                <Input
                  value={newClient.contact_phone}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, contact_phone: e.target.value }))
                  }
                  placeholder="(11) 99999-8888"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">E-mail</Label>
                <Input
                  value={newClient.contact_email}
                  onChange={(e) =>
                    setNewClient((prev) => ({ ...prev, contact_email: e.target.value }))
                  }
                  placeholder="gerente@restaurante.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowAddClient(false)}
              disabled={savingClient}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateClient}
              disabled={savingClient}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {savingClient ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar e Vincular'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
