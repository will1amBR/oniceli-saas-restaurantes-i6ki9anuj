import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  formatTimestamp,
} from '@/services/notifications'

export interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  priority: string
  channel: string
  read: boolean
  timestamp: string
}

type State = { notifications: NotificationItem[]; unreadCount: number }

let currentState: State = { notifications: [], unreadCount: 0 }
const listeners = new Set<() => void>()
let unsub: (() => Promise<void>) | null = null

function setState(s: State) {
  currentState = s
  listeners.forEach((l) => l())
}

async function reload() {
  try {
    const records = await getNotifications()
    setState({
      notifications: records.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority,
        channel: n.channel,
        read: n.read,
        timestamp: formatTimestamp(n.created),
      })),
      unreadCount: records.filter((n) => !n.read).length,
    })
  } catch {
    /* ignore */
  }
}

export function useNotificationsStore() {
  const [, forceUpdate] = useState({})

  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    reload()

    if (!unsub) {
      pb.collection('notifications')
        .subscribe('*', () => reload())
        .then((fn) => {
          unsub = fn
        })
        .catch(() => {})
    }

    return () => {
      listeners.delete(listener)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    await markNotificationRead(id)
    await reload()
  }, [])

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead()
    await reload()
  }, [])

  return { ...currentState, markAsRead, markAllAsRead, reload }
}
