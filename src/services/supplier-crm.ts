import pb from '@/lib/pocketbase/client'

export interface ClientData {
  id: string
  name: string
  email: string
  totalRevenue: number
  totalOrders: number
  lastOrderDate: string
  statuses: Record<string, number>
  revenuePercentage: number
  cumulativePercentage: number
  category: 'A' | 'B' | 'C'
}

export interface CrmData {
  clients: ClientData[]
  abcCurve: { A: string[]; B: string[]; C: string[] }
  totalRevenue: number
  totalOrders: number
  leadTime: number
}

export const getSupplierCrm = () =>
  pb.send('/backend/v1/supplier/crm', { method: 'GET' }) as Promise<CrmData>
