import type { OrderItem } from '@/services/orders'

export function buildReorderMessage(supplierName: string, items: OrderItem[]): string {
  const itemsList = items.map((item) => `${item.quantity} ${item.unit} de ${item.name}`).join(', ')
  return `Prezado ${supplierName}, precisamos de ${itemsList} e a quantidade necessária.`
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}
