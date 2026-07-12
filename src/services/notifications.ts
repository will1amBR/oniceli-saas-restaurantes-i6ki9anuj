import pb from '@/lib/pocketbase/client'

export interface NotificationRecord {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  priority: string
  channel: string
  read: boolean
  created: string
  updated: string
}

export const getNotifications = () =>
  pb.collection('notifications').getFullList<NotificationRecord>({ sort: '-created' })

export const markNotificationRead = (id: string) =>
  pb.collection('notifications').update(id, { read: true })

export const markAllNotificationsRead = async () => {
  const list = await getNotifications()
  await Promise.all(
    list
      .filter((n) => !n.read)
      .map((n) => pb.collection('notifications').update(n.id, { read: true })),
  )
}

export const createNotification = (data: Partial<NotificationRecord>) =>
  pb.collection('notifications').create({ ...data, read: false })

export function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 1) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `há ${diffHour}h`
  return date.toLocaleDateString('pt-BR')
}
