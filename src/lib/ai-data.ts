export interface AIRecommendation {
  id: string
  agent: 'inventory' | 'waste' | 'financial' | 'promotional' | 'supplier'
  priority: 'critical' | 'warning' | 'info' | 'success'
  title: string
  description: string
  action?: string
  impact?: string
  date: string
}

export interface AIAgentStatus {
  name: string
  icon: string
  status: 'active' | 'idle' | 'alert'
  lastRun: string
  findings: number
  description: string
}

export const aiAgentStatuses: AIAgentStatus[] = [
  {
    name: 'Agente de Estoque',
    icon: 'Package',
    status: 'active',
    lastRun: 'há 5 min',
    findings: 3,
    description: 'Monitoramento diário de níveis de estoque e padrões de consumo.',
  },
  {
    name: 'Agente Anti-Desperdício',
    icon: 'Trash2',
    status: 'alert',
    lastRun: 'há 2 min',
    findings: 2,
    description: 'Rastreamento de validade em tempo real com análise de impacto financeiro.',
  },
  {
    name: 'Analista Financeiro',
    icon: 'DollarSign',
    status: 'active',
    lastRun: 'há 10 min',
    findings: 1,
    description: 'Cálculo automatizado de CMV, margens e lucratividade por prato.',
  },
  {
    name: 'Motor Promocional',
    icon: 'Megaphone',
    status: 'active',
    lastRun: 'há 15 min',
    findings: 2,
    description: 'Geração de campanhas e combos baseados em alertas de estoque.',
  },
  {
    name: 'Previsor de Demanda',
    icon: 'TrendingUp',
    status: 'idle',
    lastRun: 'há 1 hora',
    findings: 4,
    description: 'Previsão de demanda e notificação antecipada de fornecedores.',
  },
]

export const aiRecommendations: AIRecommendation[] = [
  {
    id: 'rec-1',
    agent: 'inventory',
    priority: 'critical',
    title: 'Reposição Urgente: Salmão Fresco',
    description:
      'Consumo médio: 4kg/dia. Estoque atual: 2kg. Com margem de segurança de 15% e prazo de entrega de 2 dias, é necessário comprar 12kg imediatamente.',
    action: 'Criar Pedido de Compra',
    impact: 'Evita ruptura de estoque em 12h',
    date: 'Hoje, 09:30',
  },
  {
    id: 'rec-2',
    agent: 'waste',
    priority: 'critical',
    title: 'Risco de Vencimento: Morango Fresco',
    description:
      '5kg de morangos vencem em 1 dia. Preço de compra: R$ 15,00/kg. Perda estimada: R$ 75,00.',
    action: 'Sugerir uso em prato do dia',
    impact: 'Recuperação est. R$ 120,00',
    date: 'Hoje, 08:15',
  },
  {
    id: 'rec-3',
    agent: 'waste',
    priority: 'warning',
    title: 'Atenção: Leite Integral',
    description:
      '12 litros vencem em 2 dias. Preço de compra: R$ 4,50/L. Perda estimada: R$ 54,00.',
    action: 'Priorizar uso em receitas',
    impact: 'Mitigação de perda R$ 54,00',
    date: 'Ontem, 18:45',
  },
  {
    id: 'rec-4',
    agent: 'financial',
    priority: 'info',
    title: 'Análise de Lucratividade: Risoto de Funghi',
    description:
      'CMV: 28%. Margem de contribuição: 72%. Lucro bruto por prato: R$ 46,80. Recomendado manter no cardápio e considerar aumento de preço.',
    action: 'Ver ficha técnica',
    impact: 'Oportunidade de +R$ 2.340/mês',
    date: 'Hoje, 07:00',
  },
  {
    id: 'rec-5',
    agent: 'promotional',
    priority: 'success',
    title: 'Combo Sugerido: "Tartar de Salmão + Bebida"',
    description:
      'Estoque excessivo de salmão (2kg restantes, vencimento próximo). Combo sugerido a R$ 79,90 (de R$ 99,90). Copy pronta para WhatsApp e Instagram.',
    action: 'Ver copy promocional',
    impact: 'Recuperação est. R$ 170,00',
    date: 'Hoje, 09:00',
  },
  {
    id: 'rec-6',
    agent: 'supplier',
    priority: 'info',
    title: 'Previsão de Compra: Hortifruti Central',
    description:
      'Baseado em histórico de vendas, previsão de demanda para os próximos 5 dias: Tomate 30kg, Cebola 20kg, Alho 5kg. Notificação enviada ao fornecedor (entrega em 3 dias).',
    action: 'Ver detalhes da previsão',
    impact: 'Garantia de abastecimento',
    date: 'Hoje, 06:00',
  },
  {
    id: 'rec-7',
    agent: 'supplier',
    priority: 'warning',
    title: 'Previsão de Compra: Laticínios Bom Campo',
    description:
      'Demanda prevista: Queijo Parmesão 5kg, Leite Integral 30L. Entrega prevista: 3 dias. Fornecedor notificado.',
    action: 'Confirmar com fornecedor',
    impact: 'Prevenção de ruptura',
    date: 'Hoje, 06:05',
  },
]

export const promotionalCopies = [
  {
    id: 'promo-1',
    product: 'Morango Fresco',
    type: 'WhatsApp',
    copy: '🍓 PROMOÇÃO RELÂMPAGO! Torta de Morango artesanal por apenas R$ 18,90 (de R$ 22,00). Válida hoje! Peça já: 📞 (11) 99999-0000',
  },
  {
    id: 'promo-2',
    product: 'Morango Fresco',
    type: 'Instagram',
    copy: '🍰 Sobre a sobremesa perfeita... Nossa Torta de Morango está com super desconto hoje! Morangos selecionados, cream cheese e massa amanteigada. Aproveite: R$ 18,90! #Oniceli #Sobremesa #Promoção',
  },
  {
    id: 'promo-3',
    product: 'Salmão Fresco',
    type: 'Delivery',
    copy: '🐟 COMBO DO DIA: Tartar de Salmão + Bebida por R$ 79,90 (de R$ 99,90). Peça no iFood ou Uber Eats. Quantidade limitada!',
  },
]

export const supplierForecasts = [
  {
    id: 'fc-1',
    supplier: 'Hortifruti Central',
    product: 'Tomate Longa Vida',
    estimatedQty: '30 kg',
    deliveryDate: '3 dias',
    confidence: 92,
    status: 'notified',
  },
  {
    id: 'fc-2',
    supplier: 'Hortifruti Central',
    product: 'Cebola',
    estimatedQty: '20 kg',
    deliveryDate: '3 dias',
    confidence: 88,
    status: 'notified',
  },
  {
    id: 'fc-3',
    supplier: 'Laticínios Bom Campo',
    product: 'Queijo Parmesão',
    estimatedQty: '5 kg',
    deliveryDate: '3 dias',
    confidence: 85,
    status: 'notified',
  },
  {
    id: 'fc-4',
    supplier: 'Laticínios Bom Campo',
    product: 'Leite Integral',
    estimatedQty: '30 L',
    deliveryDate: '3 dias',
    confidence: 90,
    status: 'notified',
  },
  {
    id: 'fc-5',
    supplier: 'Distribuidora Pescados Mar',
    product: 'Salmão Fresco',
    estimatedQty: '12 kg',
    deliveryDate: '2 dias',
    confidence: 95,
    status: 'urgent',
  },
]

export const inventoryAnalysis = [
  {
    item: 'Salmão Fresco',
    avgConsumption: '4 kg/dia',
    daysRemaining: 0.5,
    safetyMargin: '15%',
    leadTime: 2,
    needsReposition: true,
    recommendedQty: '12 kg',
    supplier: 'Distribuidora Pescados Mar',
  },
  {
    item: 'Tomate Longa Vida',
    avgConsumption: '3 kg/dia',
    daysRemaining: 8.3,
    safetyMargin: '15%',
    leadTime: 1,
    needsReposition: false,
    recommendedQty: '-',
    supplier: 'Hortifruti Central',
  },
  {
    item: 'Leite Integral',
    avgConsumption: '6 L/dia',
    daysRemaining: 2,
    safetyMargin: '15%',
    leadTime: 3,
    needsReposition: true,
    recommendedQty: '30 L',
    supplier: 'Laticínios Bom Campo',
  },
  {
    item: 'Arroz Branco',
    avgConsumption: '5 kg/dia',
    daysRemaining: 10,
    safetyMargin: '15%',
    leadTime: 5,
    needsReposition: false,
    recommendedQty: '-',
    supplier: 'Distribuidora Grãos Sul',
  },
]

export const chatResponses: Record<string, string> = {
  'quanto devo comprar amanha':
    'Baseado no consumo médio e lead time dos fornecedores, recomendo comprar:\n\n🐟 Salmão Fresco: 12kg (Distribuidora Pescados Mar)\n🥛 Leite Integral: 30L (Laticínios Bom Campo)\n🍅 Tomate: 10kg (Hortifruti Central)\n\nTotal estimado: R$ 1.520,00. As notificações de pré-compra já foram enviadas aos fornecedores.',
  'qual ingrediente gera maior desperdicio':
    'O ingrediente com maior desperdício atualmente é o **Morango Fresco**.\n\n📊 Dados:\n• 5kg a vencer em 1 dia\n• Perda estimada: R$ 75,00\n• Custo de compra: R$ 15,00/kg\n\n💡 Sugestão da IA: Criar promoção "Torta de Morango" para recuperar R$ 120,00.',
  'qual prato possui maior margem':
    'O prato com maior margem operacional é o **Risoto de Funghi**.\n\n📊 Análise financeira:\n• Preço de venda: R$ 65,00\n• Custo (CMV): R$ 18,20\n• Margem: 72%\n• Lucro por prato: R$ 46,80\n• Volume mensal: 145 pedidos\n\n💡 Recomendação: Considere um aumento de 5% no preço — a demanda provavelmente se mantém estável.',
  'quanto vou faturar nesta semana':
    'Previsão de faturamento para esta semana: **R$ 28.450,00**\n\n📊 Detalhamento:\n• Segunda: R$ 2.400\n• Terça: R$ 3.000\n• Quarta: R$ 3.600\n• Quinta: R$ 4.400\n• Sexta: R$ 7.000\n• Sábado: R$ 9.000\n• Domingo: R$ 7.600\n\nCustos estimados: R$ 8.100 (CMV 28.5%)\nLucro líquido projetado: R$ 20.350,00',
}

export const defaultChatResponse =
  'Posso ajudar com informações sobre estoque, desperdício, finanças, fornecedores e promoções. Tente perguntar:\n\n• "Quanto devo comprar amanhã?"\n• "Qual ingrediente gera maior desperdício?"\n• "Qual prato possui maior margem?"\n• "Quanto vou faturar nesta semana?"'

export interface AppNotification {
  id: string
  type: 'stock_rupture' | 'expiry_warning' | 'purchase_needed' | 'promotion' | 'supplier_preview'
  channel: 'internal' | 'push' | 'sms'
  title: string
  message: string
  priority: 'critical' | 'warning' | 'info' | 'success'
  timestamp: string
  read: boolean
}

export const initialNotifications: AppNotification[] = [
  {
    id: 'n-1',
    type: 'stock_rupture',
    channel: 'internal',
    title: 'Ruptura de Estoque Iminente',
    message: 'Salmão Fresco abaixo da margem de segurança. Restam apenas 2kg (consumo: 4kg/dia).',
    priority: 'critical',
    timestamp: 'há 5 min',
    read: false,
  },
  {
    id: 'n-2',
    type: 'expiry_warning',
    channel: 'push',
    title: 'Alerta de Vencimento',
    message: '5kg de Morango Fresco vencem amanhã. Ação recomendada: promoção.',
    priority: 'critical',
    timestamp: 'há 15 min',
    read: false,
  },
  {
    id: 'n-3',
    type: 'purchase_needed',
    channel: 'sms',
    title: 'Pedido de Compra Enviado',
    message: 'Pré-pedido enviado para Laticínios Bom Campo: 30L de Leite Integral.',
    priority: 'warning',
    timestamp: 'há 30 min',
    read: false,
  },
  {
    id: 'n-4',
    type: 'promotion',
    channel: 'internal',
    title: 'Nova Promoção Sugerida',
    message: 'Combo Tartar de Salmão + Bebida a R$ 79,90. Copy pronta para WhatsApp.',
    priority: 'success',
    timestamp: 'há 1 hora',
    read: true,
  },
  {
    id: 'n-5',
    type: 'supplier_preview',
    channel: 'push',
    title: 'Fornecedor Notificado',
    message: 'Hortifruti Central recebeu previsão de compra: 30kg de Tomate, entrega em 3 dias.',
    priority: 'info',
    timestamp: 'há 2 horas',
    read: true,
  },
]
