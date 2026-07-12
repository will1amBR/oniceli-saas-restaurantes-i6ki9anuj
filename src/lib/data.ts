export const mockKPIs = {
  estoqueDisponivel: 45230.5,
  cmvAtual: 28.5, // %
  margemLucro: 18.2, // %
  ticketMedio: 85.4,
}

export const mockAlerts = [
  {
    id: 1,
    type: 'critical',
    title: 'Salmão Fresco',
    message: 'Estoque abaixo da margem de segurança (Restam 2kg).',
    date: 'Hoje, 09:30',
  },
  {
    id: 2,
    type: 'warning',
    title: 'Leite Integral',
    message: '12 litros vencem em 2 dias.',
    date: 'Ontem, 18:45',
  },
]

export const mockAIInsights = [
  {
    id: 1,
    type: 'buy',
    title: 'Sugestão de Compra',
    description: 'Previsto aumento de 15% no preço do Tomate Longa Vida. Sugerido comprar 20kg.',
    savings: 'Economia est. R$ 45,00',
  },
  {
    id: 2,
    type: 'optimize',
    title: 'Otimização de Desperdício',
    description:
      '5kg de Morango próximos ao vencimento. Sugestão: Criar promoção de "Torta de Morango".',
    savings: 'Recuperação est. R$ 120,00',
  },
]

export const mockChartData = [
  { name: 'Jan', vendas: 4000, custos: 2400 },
  { name: 'Fev', vendas: 3000, custos: 1398 },
  { name: 'Mar', vendas: 2000, custos: 9800 },
  { name: 'Abr', vendas: 2780, custos: 3908 },
  { name: 'Mai', vendas: 1890, custos: 4800 },
  { name: 'Jun', vendas: 2390, custos: 3800 },
  { name: 'Jul', vendas: 3490, custos: 4300 },
]

export const mockInventory = [
  {
    id: '1',
    name: 'Salmão Fresco',
    category: 'Peixes',
    location: 'Câmara Fria',
    unit: 'kg',
    quantity: 2,
    minQuantity: 5,
    cost: 85.0,
    status: 'critical',
  },
  {
    id: '2',
    name: 'Tomate Longa Vida',
    category: 'Hortifruti',
    location: 'Geladeira',
    unit: 'kg',
    quantity: 25,
    minQuantity: 10,
    cost: 6.5,
    status: 'healthy',
  },
  {
    id: '3',
    name: 'Leite Integral',
    category: 'Laticínios',
    location: 'Geladeira',
    unit: 'L',
    quantity: 12,
    minQuantity: 20,
    cost: 4.5,
    status: 'warning',
  },
  {
    id: '4',
    name: 'Arroz Branco',
    category: 'Secos',
    location: 'Estoque Seco',
    unit: 'kg',
    quantity: 50,
    minQuantity: 20,
    cost: 5.2,
    status: 'healthy',
  },
  {
    id: '5',
    name: 'Batata Palito',
    category: 'Congelados',
    location: 'Freezer',
    unit: 'kg',
    quantity: 30,
    minQuantity: 15,
    cost: 12.0,
    status: 'healthy',
  },
]

export const mockRecipes = [
  {
    id: '1',
    name: 'Salmão Grelhado',
    category: 'Prato Principal',
    price: 89.9,
    cost: 28.5,
    margin: 68.3,
    active: true,
  },
  {
    id: '2',
    name: 'Risoto de Funghi',
    category: 'Prato Principal',
    price: 65.0,
    cost: 18.2,
    margin: 72.0,
    active: true,
  },
  {
    id: '3',
    name: 'Torta de Morango',
    category: 'Sobremesa',
    price: 22.0,
    cost: 6.5,
    margin: 70.4,
    active: true,
  },
]

export const mockPurchases = [
  {
    id: 'ORD-001',
    supplier: 'Distribuidora Pescados Mar',
    date: '2023-10-25',
    total: 1250.0,
    status: 'Entregue',
  },
  {
    id: 'ORD-002',
    supplier: 'Hortifruti Central',
    date: '2023-10-27',
    total: 450.5,
    status: 'Solicitado',
  },
  {
    id: 'ORD-003',
    supplier: 'Laticínios Bom Campo',
    date: '2023-10-28',
    total: 890.0,
    status: 'Em Trânsito',
  },
]
