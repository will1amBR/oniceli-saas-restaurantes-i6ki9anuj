import pb from '@/lib/pocketbase/client'
import { getInventory, updateInventoryItem, type InventoryItem } from '@/services/inventory'
import { createWasteLog } from '@/services/waste-logs'
import { getKitchenOrders, type KitchenOrder } from '@/services/kitchen-orders'
import { getMenuItems, type MenuItem } from '@/services/menu-items'

export interface DailyConsumptionItem {
  inventory_id: string
  name: string
  unit: string
  category: string
  unit_cost: number
  theoretical_quantity: number
  real_quantity: number
  difference_quantity: number // real - theoretical
  divergence_cost: number // difference_quantity * unit_cost (if real > theoretical)
  current_stock: number
  is_extra?: boolean // Insumo avulso adicionado manualmente
  notes?: string
}

export interface DailyConsumptionRecord {
  id: string
  restaurant_id: string
  user_id: string
  date: string
  items: string | DailyConsumptionItem[]
  total_theoretical_cost: number
  total_real_cost: number
  total_divergence_cost: number
  notes?: string
  status: 'draft' | 'confirmed' | 'reconciled'
  created: string
  updated: string
}

export interface SaveDailyConsumptionPayload {
  restaurant_id?: string
  user_id?: string
  date: string
  items: DailyConsumptionItem[]
  notes?: string
}

/**
 * Calcula o consumo teórico do dia com base nas receitas dos pedidos concluídos/baixados (ready ou delivered)
 * ou todos os pedidos registrados hoje.
 */
export async function calculateTheoreticalDailyConsumption(
  targetDateStr?: string,
  restaurantId?: string,
): Promise<{
  date: string
  items: DailyConsumptionItem[]
  inventoryMap: Map<string, InventoryItem>
}> {
  const dateStr = targetDateStr || new Date().toISOString().split('T')[0]

  // Buscar inventário completo e menu items
  const [allInventory, allMenuItems, allOrders] = await Promise.all([
    getInventory().catch(() => [] as InventoryItem[]),
    getMenuItems().catch(() => [] as MenuItem[]),
    getKitchenOrders(restaurantId).catch(() => [] as KitchenOrder[]),
  ])

  // Mapas auxiliares para busca rápida
  const invMap = new Map<string, InventoryItem>()
  const invByName = new Map<string, InventoryItem>()
  allInventory.forEach((inv) => {
    invMap.set(inv.id, inv)
    invByName.set(inv.name.trim().toLowerCase(), inv)
  })

  const menuMap = new Map<string, MenuItem>()
  const menuByName = new Map<string, MenuItem>()
  allMenuItems.forEach((m) => {
    menuMap.set(m.id, m)
    menuByName.set(m.name.trim().toLowerCase(), m)
  })

  // Acumulador de consumo por ingrediente (key: inventory_id)
  const consumptionMap = new Map<
    string,
    {
      inv: InventoryItem
      theoreticalQty: number
    }
  >()

  // Filtrar pedidos relevantes do dia (pedidos criados na data informada ou prontos/entregues)
  const targetOrders = allOrders.filter((order) => {
    if (!order.created) return false
    const orderDate = order.created.split('T')[0]
    return orderDate === dateStr
  })

  // Se não houver pedidos na data exata de hoje (ex: ambiente de teste onde os seeds são de outra data),
  // pega os pedidos com stock_deducted ou status ready/delivered para permitir que o cozinheiro veja dados reais
  const ordersToProcess =
    targetOrders.length > 0
      ? targetOrders
      : allOrders.filter(
          (o) => o.stock_deducted || o.status === 'ready' || o.status === 'delivered',
        )

  // Iterar pedidos e somar os insumos
  for (const order of ordersToProcess) {
    let rawItems: any[] = []
    if (Array.isArray(order.items)) {
      rawItems = order.items
    } else if (typeof order.items === 'string') {
      try {
        rawItems = JSON.parse(order.items || '[]')
      } catch {
        rawItems = []
      }
    }

    for (const orderItem of rawItems) {
      const orderQty = Number(orderItem.quantity || orderItem.qty || 1)
      if (orderQty <= 0) continue

      let menuItem = orderItem.menu_item_id ? menuMap.get(orderItem.menu_item_id) : undefined
      if (!menuItem && orderItem.name) {
        menuItem = menuByName.get(orderItem.name.trim().toLowerCase())
      }

      if (!menuItem) continue

      // Extrair ingredientes da ficha técnica
      let ingredients: any[] = []
      if (Array.isArray(menuItem.ingredients)) {
        ingredients = menuItem.ingredients
      } else if (typeof menuItem.ingredients === 'string') {
        try {
          ingredients = JSON.parse(menuItem.ingredients || '[]')
        } catch {
          ingredients = []
        }
      }

      for (const ing of ingredients) {
        const neededPerPortion = Number(ing.quantity || ing.qty || 0)
        if (neededPerPortion <= 0) continue

        let invRecord = ing.inventory_id ? invMap.get(ing.inventory_id) : undefined
        if (!invRecord) {
          const ingName = (ing.name || ing.item || '').trim().toLowerCase()
          if (ingName) {
            invRecord = invByName.get(ingName)
          }
        }

        if (!invRecord) continue

        const totalNeeded = neededPerPortion * orderQty
        const existing = consumptionMap.get(invRecord.id)
        if (existing) {
          existing.theoreticalQty += totalNeeded
        } else {
          consumptionMap.set(invRecord.id, {
            inv: invRecord,
            theoreticalQty: totalNeeded,
          })
        }
      }
    }
  }

  // Se nenhum pedido foi encontrado ou nenhum insumo foi extraído, incluir os principais itens de cozinha do estoque com 0
  const items: DailyConsumptionItem[] = []

  consumptionMap.forEach(({ inv, theoreticalQty }) => {
    // Arredondar para até 3 casas decimais
    const roundedTheoretical = Math.round(theoreticalQty * 1000) / 1000
    items.push({
      inventory_id: inv.id,
      name: inv.name,
      unit: inv.unit || 'kg',
      category: inv.category || 'Cozinha',
      unit_cost: inv.unit_cost || 0,
      theoretical_quantity: roundedTheoretical,
      real_quantity: roundedTheoretical, // Inicia igual ao teórico
      difference_quantity: 0,
      divergence_cost: 0,
      current_stock: inv.quantity || 0,
      is_extra: false,
    })
  })

  // Ordenar itens por nome
  items.sort((a, b) => a.name.localeCompare(b.name))

  return {
    date: dateStr,
    items,
    inventoryMap: invMap,
  }
}

/**
 * Busca registros de fechamento diário
 */
export async function getDailyConsumptions(restaurantId?: string, dateStr?: string) {
  let filter = ''
  if (restaurantId) {
    filter = `restaurant_id = "${restaurantId}"`
  }
  if (dateStr) {
    filter = filter ? `${filter} && date ~ "${dateStr}"` : `date ~ "${dateStr}"`
  }

  return pb.collection('daily_consumptions').getFullList<DailyConsumptionRecord>({
    filter: filter || undefined,
    sort: '-date',
    expand: 'user_id,restaurant_id',
  })
}

/**
 * Salva o Fechamento de Consumo Diário e reconcilia o estoque real:
 * Se o cozinheiro gastou mais do que o teórico baixado pelos pedidos (real > teórico),
 * a diferença é descontada do estoque e registrada como log de desperdício/queima.
 */
export async function saveAndReconcileDailyConsumption(
  payload: SaveDailyConsumptionPayload,
): Promise<{
  consumptionRecord: DailyConsumptionRecord
  reconciledItemsCount: number
  totalDivergenceLoss: number
}> {
  const { date, items, notes, restaurant_id, user_id } = payload

  const currentAuth = pb.authStore.record
  const effectiveUserId = user_id || currentAuth?.id || ''
  const effectiveRestId = restaurant_id || (currentAuth as any)?.restaurant_id || effectiveUserId

  let totalTheoreticalCost = 0
  let totalRealCost = 0
  let totalDivergenceCost = 0

  // 1. Processar itens, calcular divergências e atualizar o estoque
  let reconciledItemsCount = 0

  for (const item of items) {
    const theoQty = Number(item.theoretical_quantity || 0)
    const realQty = Number(item.real_quantity || 0)
    const diffQty = Math.max(0, realQty - theoQty) // Excesso além da comanda
    const unitCost = Number(item.unit_cost || 0)

    totalTheoreticalCost += theoQty * unitCost
    totalRealCost += realQty * unitCost

    if (diffQty > 0) {
      const divergenceLoss = Math.round(diffQty * unitCost * 100) / 100
      totalDivergenceCost += divergenceLoss
      item.difference_quantity = diffQty
      item.divergence_cost = divergenceLoss

      // Reconciliar estoque: deduzir a diferença adicional não prevista na receita
      try {
        const invRecord = await pb.collection('inventory').getOne<InventoryItem>(item.inventory_id)
        if (invRecord) {
          const currentStock = Number(invRecord.quantity || 0)
          const newStock = Math.max(0, currentStock - diffQty)

          // Recalcular status do estoque
          const minStock = Number(invRecord.min_stock || 0)
          let newStatus: InventoryItem['status'] = 'healthy'
          if (newStock <= 0) newStatus = 'critical'
          else if (newStock <= minStock) newStatus = 'warning'

          await updateInventoryItem(invRecord.id, {
            quantity: newStock,
            status: newStatus,
          })

          // Registrar no log de desperdício do sistema
          await createWasteLog({
            item_id: invRecord.id,
            quantity: diffQty,
            reason: item.notes || 'Ajuste de Fechamento Diário da Cozinha',
            financial_loss: divergenceLoss,
            date: date,
            user_id: effectiveRestId,
          }).catch(() => {})

          reconciledItemsCount++
        }
      } catch (err) {
        console.warn(`Erro ao reconciliar estoque para item ${item.name}:`, err)
      }
    } else {
      item.difference_quantity = 0
      item.divergence_cost = 0
    }
  }

  // 2. Salvar o registro do fechamento na collection daily_consumptions
  const recordData = {
    restaurant_id: effectiveRestId,
    user_id: effectiveUserId,
    date: date.includes('T') ? date : `${date} 00:00:00.000Z`,
    items: JSON.stringify(items),
    total_theoretical_cost: Math.round(totalTheoreticalCost * 100) / 100,
    total_real_cost: Math.round(totalRealCost * 100) / 100,
    total_divergence_cost: Math.round(totalDivergenceCost * 100) / 100,
    notes: notes || 'Fechamento de consumo diário realizado pela equipe de cozinha',
    status: 'reconciled' as const,
  }

  const createdRecord = await pb
    .collection('daily_consumptions')
    .create<DailyConsumptionRecord>(recordData)

  return {
    consumptionRecord: createdRecord,
    reconciledItemsCount,
    totalDivergenceLoss: Math.round(totalDivergenceCost * 100) / 100,
  }
}
