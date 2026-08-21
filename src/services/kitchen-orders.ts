import pb from '@/lib/pocketbase/client'

export interface KitchenOrderItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export type KitchenOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface KitchenOrder {
  id: string
  restaurant_id: string
  waiter_id: string
  table_number: string
  customer_name?: string
  items: string | KitchenOrderItem[]
  status: KitchenOrderStatus
  total_amount: number
  notes?: string
  stock_deducted: boolean
  created: string
  updated: string
  expand?: {
    restaurant_id?: { id: string; name: string; email: string }
    waiter_id?: { id: string; name: string; email: string }
  }
}

export interface CreateKitchenOrderPayload {
  restaurant_id?: string
  waiter_id?: string
  table_number: string
  customer_name?: string
  items: string
  status?: KitchenOrderStatus
  total_amount: number
  notes?: string
  stock_deducted?: boolean
}

export const getKitchenOrders = (restaurantId?: string) => {
  const filter = restaurantId ? `restaurant_id = "${restaurantId}"` : ''
  return pb.collection('kitchen_orders').getFullList<KitchenOrder>({
    filter: filter || undefined,
    sort: '-created',
    expand: 'waiter_id,restaurant_id',
  })
}

export const getActiveKitchenOrders = (restaurantId?: string) => {
  let filter = `status != "delivered" && status != "cancelled"`
  if (restaurantId) {
    filter = `(${filter}) && restaurant_id = "${restaurantId}"`
  }
  return pb.collection('kitchen_orders').getFullList<KitchenOrder>({
    filter,
    sort: 'created',
    expand: 'waiter_id,restaurant_id',
  })
}

export const createKitchenOrder = (data: CreateKitchenOrderPayload) =>
  pb.collection('kitchen_orders').create<KitchenOrder>(data)

export const updateKitchenOrderStatus = (id: string, status: KitchenOrderStatus) =>
  pb.collection('kitchen_orders').update<KitchenOrder>(id, { status })

export const updateKitchenOrder = (id: string, data: Partial<KitchenOrder>) =>
  pb.collection('kitchen_orders').update<KitchenOrder>(id, data)

export const deleteKitchenOrder = (id: string) => pb.collection('kitchen_orders').delete(id)
