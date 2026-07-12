import pb from '@/lib/pocketbase/client'

export interface WasteLog {
  id: string
  item_id: string
  quantity: number
  reason: string
  financial_loss: number
  date: string
  expand?: { item_id?: any }
}

export const getWasteLogs = () =>
  pb.collection('waste_logs').getFullList<WasteLog>({ sort: '-date', expand: 'item_id' })

export const createWasteLog = (data: Partial<WasteLog>) => pb.collection('waste_logs').create(data)

export const deleteWasteLog = (id: string) => pb.collection('waste_logs').delete(id)
