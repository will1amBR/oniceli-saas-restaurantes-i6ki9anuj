import pb from '@/lib/pocketbase/client'

export type AppRole = 'restaurant' | 'supplier' | 'kitchen' | 'waiter' | 'bar'

export interface User {
  id: string
  name: string
  email: string
  role: AppRole | ''
  restaurant_id?: string
  created: string
  updated: string
  avatar: string
  expand?: {
    restaurant_id?: { id: string; name: string }
  }
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role: string
  restaurant_id?: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: string
  restaurant_id?: string
}

export const getUsers = () => pb.collection('users').getFullList<User>({ sort: '-created' })

export const createUser = (data: CreateUserPayload) => pb.collection('users').create<User>(data)

export const updateUser = (id: string, data: UpdateUserPayload) =>
  pb.collection('users').update<User>(id, data)

export const deleteUser = (id: string) => pb.collection('users').delete(id)
