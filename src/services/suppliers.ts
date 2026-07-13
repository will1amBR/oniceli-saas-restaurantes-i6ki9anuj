import pb from '@/lib/pocketbase/client'

export interface ProductEntry {
  name: string
  sku?: string
  fiscal_code?: string
  price?: number
  category?: string
}

export interface BankInfo {
  recipient_name: string
  bank: string
  agency: string
  account: string
  account_type: string
}

export interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  categories: string
  products: string
  delivery_lead_time: number
  rating: number
  status: string
  user_id: string
  bank_account_info: string
  tax_id: string
  pix_key: string
}

export function parseProducts(raw: string): ProductEntry[] {
  try {
    const parsed = JSON.parse(raw || '[]')
    if (Array.isArray(parsed)) {
      return parsed.map((p: any) => (typeof p === 'string' ? { name: p } : p))
    }
  } catch {
    /* ignore */
  }
  return []
}

export function parseBankInfo(raw: string): BankInfo {
  try {
    const parsed = JSON.parse(raw || '{}')
    if (parsed && typeof parsed === 'object') {
      return {
        recipient_name: parsed.recipient_name || '',
        bank: parsed.bank || '',
        agency: parsed.agency || '',
        account: parsed.account || '',
        account_type: parsed.account_type || '',
      }
    }
  } catch {
    /* ignore */
  }
  return { recipient_name: '', bank: '', agency: '', account: '', account_type: '' }
}

export const getSuppliers = () =>
  pb.collection('suppliers').getFullList<Supplier>({ sort: '-created' })

export const createSupplier = (data: Partial<Supplier>) => pb.collection('suppliers').create(data)

export const updateSupplier = (id: string, data: Partial<Supplier>) =>
  pb.collection('suppliers').update(id, data)

export const deleteSupplier = (id: string) => pb.collection('suppliers').delete(id)
