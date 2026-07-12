import pb from '@/lib/pocketbase/client'

export interface InventoryItem {
  id: string
  name: string
  category: string
  location: string
  quantity: number
  unit: string
  unit_cost: number
  min_stock: number
  expiry_date: string
  supplier_id: string
  status: string
  user_id: string
  expand?: { supplier_id?: any }
}

export const getInventory = () =>
  pb.collection('inventory').getFullList<InventoryItem>({ sort: '-created', expand: 'supplier_id' })

export const createInventoryItem = (data: Partial<InventoryItem>) =>
  pb.collection('inventory').create(data)

export const updateInventoryItem = (id: string, data: Partial<InventoryItem>) =>
  pb.collection('inventory').update(id, data)

export const deleteInventoryItem = (id: string) => pb.collection('inventory').delete(id)

export function computeStatus(quantity: number, minStock: number, expiryDate: string): string {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
  if (quantity <= 0 || daysUntilExpiry < 0) return 'expired'
  if (quantity <= minStock || daysUntilExpiry <= 2) return 'critical'
  if (quantity <= minStock * 1.5 || daysUntilExpiry <= 5) return 'warning'
  return 'healthy'
}
