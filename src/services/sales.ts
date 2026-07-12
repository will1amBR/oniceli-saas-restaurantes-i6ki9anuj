import pb from '@/lib/pocketbase/client'

export interface SaleRecord {
  id: string
  item_id: string
  quantity_sold: number
  date: string
  total_price: number
  expand?: { item_id?: any }
}

export const getSales = () =>
  pb.collection('sales_data').getFullList<SaleRecord>({ sort: '-date', expand: 'item_id' })

export const createSale = (data: Partial<SaleRecord>) => pb.collection('sales_data').create(data)

export const deleteSale = (id: string) => pb.collection('sales_data').delete(id)
