import pb from '@/lib/pocketbase/client'

export interface SaleRecord {
  id: string
  item_id: string
  quantity_sold: number
  date: string
  total_price: number
  user_id: string
  expand?: { item_id?: any }
}

export const getSales = () =>
  pb.collection('sales_data').getFullList<SaleRecord>({ sort: '-date', expand: 'item_id' })

export const createSale = (data: Partial<SaleRecord>) => pb.collection('sales_data').create(data)

export const updateSale = (id: string, data: Partial<SaleRecord>) =>
  pb.collection('sales_data').update(id, data)

export const deleteSale = (id: string) => pb.collection('sales_data').delete(id)
