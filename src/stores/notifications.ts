import { useState, useCallback, useEffect } from 'react'
import { initialNotifications, type AppNotification } from '@/lib/ai-data'

let globalNotifications: AppNotification[] = [...initialNotifications]
const listeners: Array<(notifications: AppNotification[]) => void> = []

function emit() {
  listeners.forEach((fn) => fn([...globalNotifications]))
}

export function useNotificationsStore() {
  const [notifications, setNotifications] = useState<AppNotification[]>(globalNotifications)

  useEffect(() => {
    const listener = (n: AppNotification[]) => setNotifications(n)
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx > -1) listeners.splice(idx, 1)
    }
  }, [])

  const markAsRead = useCallback((id: string) => {
    globalNotifications = globalNotifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    emit()
  }, [])

  const markAllAsRead = useCallback(() => {
    globalNotifications = globalNotifications.map((n) => ({ ...n, read: true }))
    emit()
  }, [])

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `n-${Date.now()}`,
      timestamp: 'agora',
      read: false,
    }
    globalNotifications = [newNotif, ...globalNotifications]
    emit()
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markAsRead, markAllAsRead, addNotification }
}

export default useNotificationsStore
