import pb from '@/lib/pocketbase/client'

export interface OrderItem {
  name: string
  quantity: number
  unit: string
  price: number
}

export interface Order {
  id: string
  restaurant_id: string
  supplier_id: string
  items: string
  total_amount: number
  status: string
  created: string
  updated: string
  expand?: {
    restaurant_id?: { id: string; name: string; email: string }
    supplier_id?: { id: string; name: string; phone: string; categories?: string }
  }
}

export const getOrdersForSupplier = (supplierId: string) =>
  pb.collection('orders').getFullList<Order>({
    filter: `supplier_id = "${supplierId}"`,
    sort: '-created',
    expand: 'restaurant_id',
  })

export const getOrdersForRestaurant = (userId: string) =>
  pb.collection('orders').getFullList<Order>({
    filter: `restaurant_id = "${userId}"`,
    sort: '-created',
    expand: 'supplier_id',
  })

export const createOrder = (data: Partial<Order>) => pb.collection('orders').create(data)

export const updateOrderStatus = (id: string, status: string) =>
  pb.collection('orders').update(id, { status })

export const deleteOrder = (id: string) => pb.collection('orders').delete(id)
