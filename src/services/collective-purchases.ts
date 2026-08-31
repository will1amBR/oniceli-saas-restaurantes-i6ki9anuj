import pb from '@/lib/pocketbase/client'
import type { Supplier } from '@/services/suppliers'

export interface CollectiveCampaign {
  id: string
  title: string
  description: string
  item_name: string
  category: string
  unit: string
  supplier_id: string
  regular_unit_price: number
  collective_unit_price: number
  target_quantity: number
  current_quantity: number
  min_order_per_restaurant: number
  deadline: string
  status: 'active' | 'goal_reached' | 'ordered' | 'closed'
  created: string
  updated: string
  expand?: {
    supplier_id?: Supplier
  }
}

export interface CollectiveOrder {
  id: string
  campaign_id: string
  restaurant_id: string
  quantity: number
  unit_price: number
  regular_price: number
  total_cost: number
  estimated_savings: number
  status: 'joined' | 'confirmed' | 'delivered' | 'cancelled'
  notes: string
  created: string
  updated: string
  expand?: {
    campaign_id?: CollectiveCampaign
    restaurant_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface CollectiveSavingsSummary {
  totalSpent: number
  totalRegularSpent: number
  totalSaved: number
  savingsPercentage: number
  ordersCount: number
  campaignsCount: number
  itemsBreakdown: {
    itemName: string
    unit: string
    quantity: number
    saved: number
    collectivePrice: number
    regularPrice: number
  }[]
}

export async function getActiveCampaigns(): Promise<CollectiveCampaign[]> {
  try {
    return await pb.collection('collective_campaigns').getFullList<CollectiveCampaign>({
      filter: "status != 'closed'",
      sort: 'deadline',
      expand: 'supplier_id',
    })
  } catch {
    return []
  }
}

export async function getAllCampaigns(): Promise<CollectiveCampaign[]> {
  try {
    return await pb.collection('collective_campaigns').getFullList<CollectiveCampaign>({
      sort: '-created',
      expand: 'supplier_id',
    })
  } catch {
    return []
  }
}

export async function getCollectiveOrdersForRestaurant(
  restaurantId: string,
): Promise<CollectiveOrder[]> {
  try {
    return await pb.collection('collective_orders').getFullList<CollectiveOrder>({
      filter: `restaurant_id = "${restaurantId}"`,
      sort: '-created',
      expand: 'campaign_id,campaign_id.supplier_id',
    })
  } catch {
    return []
  }
}

export async function getAllCollectiveOrders(): Promise<CollectiveOrder[]> {
  try {
    return await pb.collection('collective_orders').getFullList<CollectiveOrder>({
      sort: '-created',
      expand: 'campaign_id,campaign_id.supplier_id,restaurant_id',
    })
  } catch {
    return []
  }
}

export async function joinCollectiveCampaign(params: {
  campaignId: string
  restaurantId: string
  quantity: number
  notes?: string
}): Promise<CollectiveOrder> {
  // 1. Obter campanha
  const campaign = await pb
    .collection('collective_campaigns')
    .getOne<CollectiveCampaign>(params.campaignId)

  const unitPrice = campaign.collective_unit_price
  const regularPrice = campaign.regular_unit_price
  const totalCost = params.quantity * unitPrice
  const estimatedSavings = params.quantity * (regularPrice - unitPrice)

  // 2. Criar ordem de adesão
  const order = await pb.collection('collective_orders').create<CollectiveOrder>({
    campaign_id: params.campaignId,
    restaurant_id: params.restaurantId,
    quantity: params.quantity,
    unit_price: unitPrice,
    regular_price: regularPrice,
    total_cost: totalCost,
    estimated_savings: estimatedSavings,
    status: 'joined',
    notes: params.notes || '',
  })

  // 3. Atualizar quantidade atual da campanha
  const newCurrentQty = (campaign.current_quantity || 0) + params.quantity
  const isGoalReached = newCurrentQty >= campaign.target_quantity
  await pb.collection('collective_campaigns').update(campaign.id, {
    current_quantity: newCurrentQty,
    status: isGoalReached ? 'goal_reached' : campaign.status,
  })

  return order
}

export async function createCollectiveCampaign(
  data: Partial<CollectiveCampaign>,
): Promise<CollectiveCampaign> {
  return await pb.collection('collective_campaigns').create<CollectiveCampaign>({
    ...data,
    current_quantity: data.current_quantity || 0,
    status: data.status || 'active',
  })
}

export async function updateCollectiveCampaign(
  id: string,
  data: Partial<CollectiveCampaign>,
): Promise<CollectiveCampaign> {
  return await pb.collection('collective_campaigns').update<CollectiveCampaign>(id, data)
}

export async function calculateMonthlySavings(
  restaurantId: string,
): Promise<CollectiveSavingsSummary> {
  const orders = await getCollectiveOrdersForRestaurant(restaurantId)
  const validOrders = orders.filter((o) => o.status !== 'cancelled')

  let totalSpent = 0
  let totalRegularSpent = 0
  let totalSaved = 0

  const itemsMap: Record<
    string,
    {
      itemName: string
      unit: string
      quantity: number
      saved: number
      collectivePrice: number
      regularPrice: number
    }
  > = {}

  validOrders.forEach((order) => {
    const campaign = order.expand?.campaign_id
    const itemName = campaign?.item_name || 'Insumo'
    const unit = campaign?.unit || 'un'
    const regularPrice = order.regular_price || campaign?.regular_unit_price || order.unit_price
    const colPrice = order.unit_price

    const regularCost = order.quantity * regularPrice
    const cost = order.total_cost || order.quantity * colPrice
    const saved = order.estimated_savings || regularCost - cost

    totalSpent += cost
    totalRegularSpent += regularCost
    totalSaved += saved

    if (!itemsMap[itemName]) {
      itemsMap[itemName] = {
        itemName,
        unit,
        quantity: 0,
        saved: 0,
        collectivePrice: colPrice,
        regularPrice,
      }
    }

    itemsMap[itemName].quantity += order.quantity
    itemsMap[itemName].saved += saved
  })

  const savingsPercentage = totalRegularSpent > 0 ? (totalSaved / totalRegularSpent) * 100 : 0

  return {
    totalSpent,
    totalRegularSpent,
    totalSaved,
    savingsPercentage,
    ordersCount: validOrders.length,
    campaignsCount: new Set(validOrders.map((o) => o.campaign_id)).size,
    itemsBreakdown: Object.values(itemsMap),
  }
}
