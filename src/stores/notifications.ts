import { useState, useCallback, useEffect } from 'react'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatTimestamp,
} from '@/services/notifications'
import { useRealtime } from '@/hooks/use-realtime'
import type { AppNotification } from '@/lib/ai-data'

export function useNotificationsStore() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    try {
      const records = await getNotifications()
      setNotifications(
        records.map((r) => ({
          id: r.id,
          type: r.type as any,
          channel: r.channel as any,
          title: r.title,
          message: r.message,
          priority: r.priority as any,
          timestamp: formatTimestamp(r.created),
          read: r.read,
        })),
      )
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])
  useRealtime('notifications', () => loadNotifications())

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await markNotificationRead(id)
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markAllNotificationsRead()
    } catch {
      /* intentionally ignored */
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return { notifications, unreadCount, markAsRead, markAllAsRead, loading }
}

export default useNotificationsStore
