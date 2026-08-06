import pb from '@/lib/pocketbase/client'

export interface User {
  id: string
  name: string
  email: string
  role: 'restaurant' | 'supplier' | ''
  created: string
  updated: string
  avatar: string
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  passwordConfirm: string
  role: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: string
}

export const getUsers = () => pb.collection('users').getFullList<User>({ sort: '-created' })

export const createUser = (data: CreateUserPayload) => pb.collection('users').create<User>(data)

export const updateUser = (id: string, data: UpdateUserPayload) =>
  pb.collection('users').update<User>(id, data)

export const deleteUser = (id: string) => pb.collection('users').delete(id)
