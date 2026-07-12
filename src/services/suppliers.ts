import pb from '@/lib/pocketbase/client'

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
}

export const getSuppliers = () =>
  pb.collection('suppliers').getFullList<Supplier>({ sort: '-created' })

export const createSupplier = (data: Partial<Supplier>) => pb.collection('suppliers').create(data)

export const updateSupplier = (id: string, data: Partial<Supplier>) =>
  pb.collection('suppliers').update(id, data)

export const deleteSupplier = (id: string) => pb.collection('suppliers').delete(id)
