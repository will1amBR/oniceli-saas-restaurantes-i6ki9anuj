import { useMemo } from 'react'
import type { KitchenOrder } from '@/services/kitchen-orders'

export interface KitchenMetrics {
  avgPrepTimeMinutes: number | null
  avgWaitTimeMinutes: number | null
  pendingCount: number
  preparingCount: number
  readyCount: number
  deliveredCount: number
  totalActiveCount: number
  oldestPendingMinutes: number | null
  loadStatus: 'calm' | 'moderate' | 'busy' | 'critical'
  loadStatusLabel: string
  loadStatusColor: 'emerald' | 'amber' | 'rose' | 'red'
  trafficLightText: string
}

/**
 * Calculates kitchen metrics including average preparation time,
 * queue load, oldest pending order elapsed minutes, and kitchen status (traffic light).
 */
export function calculateKitchenMetrics(orders: KitchenOrder[]): KitchenMetrics {
  const pending = orders.filter((o) => o.status === 'pending')
  const preparing = orders.filter((o) => o.status === 'preparing')
  const ready = orders.filter((o) => o.status === 'ready')
  const delivered = orders.filter((o) => o.status === 'delivered')

  const totalActiveCount = pending.length + preparing.length

  // Calculate prep times for completed/ready orders
  // Using created and updated timestamps
  const readyOrDelivered = orders.filter((o) => o.status === 'ready' || o.status === 'delivered')

  const prepDurations: number[] = []
  readyOrDelivered.forEach((o) => {
    if (o.created && o.updated) {
      const start = new Date(o.created).getTime()
      const end = new Date(o.updated).getTime()
      const diffMin = Math.round((end - start) / 60000)
      if (diffMin >= 0 && diffMin <= 240) {
        prepDurations.push(diffMin)
      }
    }
  })

  const avgPrepTimeMinutes =
    prepDurations.length > 0
      ? Math.round(prepDurations.reduce((a, b) => a + b, 0) / prepDurations.length)
      : null

  // Oldest pending order waiting time
  let oldestPendingMinutes: number | null = null
  if (pending.length > 0) {
    const oldestTimestamp = Math.min(
      ...pending.map((o) => (o.created ? new Date(o.created).getTime() : Date.now())),
    )
    oldestPendingMinutes = Math.max(0, Math.floor((Date.now() - oldestTimestamp) / 60000))
  }

  // Calculate overall average waiting time of currently active orders
  const activeOrders = [...pending, ...preparing]
  let avgWaitTimeMinutes: number | null = null
  if (activeOrders.length > 0) {
    const totalMins = activeOrders.reduce((acc, o) => {
      const start = o.created ? new Date(o.created).getTime() : Date.now()
      return acc + Math.max(0, Math.floor((Date.now() - start) / 60000))
    }, 0)
    avgWaitTimeMinutes = Math.round(totalMins / activeOrders.length)
  } else if (avgPrepTimeMinutes !== null) {
    avgWaitTimeMinutes = avgPrepTimeMinutes
  }

  // Determine Traffic Light / Load Status
  // Calm: <= 3 active orders, oldest pending < 15m
  // Moderate: 4-7 active orders or oldest pending 15-25m
  // Critical / Busy: > 7 active orders or oldest pending > 25m
  let loadStatus: 'calm' | 'moderate' | 'busy' | 'critical' = 'calm'
  let loadStatusLabel = 'Tranquilo'
  let loadStatusColor: 'emerald' | 'amber' | 'rose' | 'red' = 'emerald'
  let trafficLightText = 'Cozinha operando em ritmo normal (sem filas)'

  const oldestWait = oldestPendingMinutes ?? 0

  if (totalActiveCount === 0 && ready.length === 0) {
    loadStatus = 'calm'
    loadStatusLabel = 'Sem Fila'
    loadStatusColor = 'emerald'
    trafficLightText = 'Cozinha livre — pedidos saem rapidamente'
  } else if (totalActiveCount >= 10 || oldestWait >= 30) {
    loadStatus = 'critical'
    loadStatusLabel = 'Atraso Crítico'
    loadStatusColor = 'red'
    trafficLightText = 'Cozinha sobrecarregada! Comunique atraso aos clientes'
  } else if (totalActiveCount >= 6 || oldestWait >= 20) {
    loadStatus = 'busy'
    loadStatusLabel = 'Alta Demanda'
    loadStatusColor = 'rose'
    trafficLightText = 'Demanda alta na cozinha — previsão de espera elevada'
  } else if (totalActiveCount >= 3 || oldestWait >= 12) {
    loadStatus = 'moderate'
    loadStatusLabel = 'Atenção'
    loadStatusColor = 'amber'
    trafficLightText = 'Fluxo moderado — monitore os tempos de mesa'
  } else {
    loadStatus = 'calm'
    loadStatusLabel = 'Tranquilo'
    loadStatusColor = 'emerald'
    trafficLightText = 'Cozinha operando em ritmo rápido e controlado'
  }

  return {
    avgPrepTimeMinutes,
    avgWaitTimeMinutes,
    pendingCount: pending.length,
    preparingCount: preparing.length,
    readyCount: ready.length,
    deliveredCount: delivered.length,
    totalActiveCount,
    oldestPendingMinutes,
    loadStatus,
    loadStatusLabel,
    loadStatusColor,
    trafficLightText,
  }
}

export function useKitchenMetrics(orders: KitchenOrder[]): KitchenMetrics {
  return useMemo(() => calculateKitchenMetrics(orders), [orders])
}
