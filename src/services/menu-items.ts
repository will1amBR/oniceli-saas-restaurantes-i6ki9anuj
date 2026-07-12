import pb from '@/lib/pocketbase/client'

export interface MenuItem {
  id: string
  name: string
  price: number
  cost: number
  margin: number
  ingredients: string
  category: string
  active: boolean
}

export const getMenuItems = () =>
  pb.collection('menu_items').getFullList<MenuItem>({ sort: '-created' })

export const createMenuItem = (data: Partial<MenuItem>) => pb.collection('menu_items').create(data)

export const updateMenuItem = (id: string, data: Partial<MenuItem>) =>
  pb.collection('menu_items').update(id, data)

export const deleteMenuItem = (id: string) => pb.collection('menu_items').delete(id)
