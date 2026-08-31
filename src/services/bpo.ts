import pb from '@/lib/pocketbase/client'

export interface BpoClient {
  id: string
  bpo_user_id: string
  restaurant_id: string
  plan_name: string
  monthly_fee: number
  commission_rate: number
  status: 'active' | 'trial' | 'paused' | 'cancelled'
  contact_person: string
  contact_phone: string
  contact_email: string
  auto_reorder_alert: boolean
  whatsapp_notifications: boolean
  email_notifications: boolean
  notes: string
  created: string
  updated: string
  expand?: {
    restaurant_id?: {
      id: string
      name: string
      email: string
      phone?: string
    }
    bpo_user_id?: {
      id: string
      name: string
      email: string
    }
  }
}

export interface BpoReorderAlertItem {
  id: string
  restaurantId: string
  restaurantName: string
  restaurantEmail: string
  restaurantPhone: string
  itemName: string
  category: string
  currentQuantity: number
  minStock: number
  unit: string
  unitCost: number
  urgency: 'critical' | 'warning' | 'normal'
  supplierName?: string
  leadTime?: number
  lastDepletion?: string
}

export interface BpoMetricsSummary {
  totalClients: number
  activeClients: number
  totalMrr: number
  totalCommission: number
  criticalStockAlerts: number
  reordersTriggeredCount: number
}

export async function getBpoClients(bpoUserId: string): Promise<BpoClient[]> {
  try {
    return await pb.collection('bpo_clients').getFullList<BpoClient>({
      filter: `bpo_user_id = "${bpoUserId}"`,
      sort: '-created',
      expand: 'restaurant_id',
    })
  } catch {
    return []
  }
}

export async function getAllBpoClients(): Promise<BpoClient[]> {
  try {
    return await pb.collection('bpo_clients').getFullList<BpoClient>({
      sort: '-created',
      expand: 'restaurant_id,bpo_user_id',
    })
  } catch {
    return []
  }
}

export async function createBpoClient(data: Partial<BpoClient>): Promise<BpoClient> {
  // Se informou restaurant_id, vincula bpo_partner_id no usuário do restaurante
  if (data.restaurant_id && data.bpo_user_id) {
    try {
      await pb.collection('users').update(data.restaurant_id, {
        bpo_partner_id: data.bpo_user_id,
        phone: data.contact_phone || undefined,
      })
    } catch {
      /* ignore */
    }
  }
  return await pb.collection('bpo_clients').create<BpoClient>(data)
}

export async function updateBpoClient(id: string, data: Partial<BpoClient>): Promise<BpoClient> {
  return await pb.collection('bpo_clients').update<BpoClient>(id, data)
}

export async function deleteBpoClient(id: string): Promise<boolean> {
  try {
    await pb.collection('bpo_clients').delete(id)
    return true
  } catch {
    return false
  }
}

// Analisa o estoque dos restaurantes vinculados ao parceiro BPO para detectar necessidades de recompra
export async function getBpoStockAlerts(bpoUserId: string): Promise<BpoReorderAlertItem[]> {
  const clients = await getBpoClients(bpoUserId)
  if (clients.length === 0) return []

  const restaurantIds = clients.map((c) => c.restaurant_id)
  const clientMap = new Map(clients.map((c) => [c.restaurant_id, c]))

  const alerts: BpoReorderAlertItem[] = []

  try {
    // Buscar itens de estoque pertencentes aos restaurantes da carteira
    const filter = restaurantIds.map((id) => `user_id = "${id}"`).join(' || ')
    const inventoryItems = await pb.collection('inventory').getFullList({
      filter,
      expand: 'supplier_id,user_id',
    })

    inventoryItems.forEach((item: any) => {
      const currentQty = Number(item.quantity) || 0
      const minStock = Number(item.min_stock) || 0
      const client = clientMap.get(item.user_id)
      const restaurantName =
        client?.expand?.restaurant_id?.name || item.expand?.user_id?.name || 'Restaurante'
      const supplierName = item.expand?.supplier_id?.name || 'Fornecedor Padrão'
      const leadTime = item.expand?.supplier_id?.delivery_lead_time || 2

      // Condição de alerta: estoque atual <= minStock ou status critical/warning
      if (currentQty <= minStock || item.status === 'critical' || item.status === 'warning') {
        const isCritical = currentQty <= minStock * 0.7 || item.status === 'critical'
        alerts.push({
          id: item.id,
          restaurantId: item.user_id,
          restaurantName,
          restaurantEmail: client?.contact_email || item.expand?.user_id?.email || '',
          restaurantPhone: client?.contact_phone || item.expand?.user_id?.phone || '',
          itemName: item.name,
          category: item.category || 'Geral',
          currentQuantity: currentQty,
          minStock,
          unit: item.unit || 'un',
          unitCost: Number(item.unit_cost) || 0,
          urgency: isCritical ? 'critical' : 'warning',
          supplierName,
          leadTime,
          lastDepletion: item.updated,
        })
      }
    })
  } catch {
    /* fallback se houver erro */
  }

  return alerts
}

// Disparo multicanal de notificação de recompra para o parceiro BPO
export async function triggerBpoReorderAlert(params: {
  restaurantId: string
  itemId?: string
  channel: 'internal' | 'email' | 'whatsapp' | 'all'
  notes?: string
}): Promise<{
  success: boolean
  channels: any
  summary?: any
}> {
  try {
    const res = await pb.send('/backend/v1/bpo/reorder-alert', {
      method: 'POST',
      body: {
        restaurant_id: params.restaurantId,
        item_id: params.itemId,
        channel: params.channel,
        notes: params.notes,
      },
    })
    return res
  } catch {
    // Fallback in-app se o hook falhar
    const fallbackNotif = await pb.collection('notifications').create({
      type: 'bpo_reorder_alert',
      title: '🚨 Alerta de Recompra Manual BPO',
      message: `Recompra solicitada para o restaurante. Canal solicitado: ${params.channel}. ${params.notes || ''}`,
      priority: 'warning',
      channel: params.channel === 'all' ? 'internal' : params.channel,
      read: false,
    })
    return {
      success: true,
      channels: {
        in_app: 'delivered',
        email: 'fallback',
        whatsapp: { status: 'fallback', target_phone: '', suggested_text: '' },
      },
      summary: { notification_id: fallbackNotif.id },
    }
  }
}
