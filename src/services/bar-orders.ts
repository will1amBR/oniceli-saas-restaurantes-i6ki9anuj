import pb from '@/lib/pocketbase/client'

export interface BarOrderItem {
  menu_item_id: string
  name: string
  price: number
  quantity: number
  notes?: string
}

export type BarOrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface BarOrder {
  id: string
  restaurant_id: string
  waiter_id: string
  table_number: string
  customer_name?: string
  items: string | BarOrderItem[]
  status: BarOrderStatus
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

export interface CreateBarOrderPayload {
  restaurant_id?: string
  waiter_id?: string
  table_number: string
  customer_name?: string
  items: string
  status?: BarOrderStatus
  total_amount: number
  notes?: string
  stock_deducted?: boolean
}

export const getBarOrders = (restaurantId?: string) => {
  const filter = restaurantId ? `restaurant_id = "${restaurantId}"` : ''
  return pb.collection('bar_orders').getFullList<BarOrder>({
    filter: filter || undefined,
    sort: '-created',
    expand: 'waiter_id,restaurant_id',
  })
}

export const getActiveBarOrders = (restaurantId?: string) => {
  let filter = `status != "delivered" && status != "cancelled"`
  if (restaurantId) {
    filter = `(${filter}) && restaurant_id = "${restaurantId}"`
  }
  return pb.collection('bar_orders').getFullList<BarOrder>({
    filter,
    sort: 'created',
    expand: 'waiter_id,restaurant_id',
  })
}

export const createBarOrder = (data: CreateBarOrderPayload) =>
  pb.collection('bar_orders').create<BarOrder>(data)

export const updateBarOrderStatus = (id: string, status: BarOrderStatus) =>
  pb.collection('bar_orders').update<BarOrder>(id, { status })

export const updateBarOrder = (id: string, data: Partial<BarOrder>) =>
  pb.collection('bar_orders').update<BarOrder>(id, data)

export const deleteBarOrder = (id: string) => pb.collection('bar_orders').delete(id)
