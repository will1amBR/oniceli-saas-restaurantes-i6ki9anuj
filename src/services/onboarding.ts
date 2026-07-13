import pb from '@/lib/pocketbase/client'
import { createSupplier } from '@/services/suppliers'

export interface OnboardingData {
  role: 'restaurant' | 'supplier'
  questionnaire: Record<string, string>
  plan: string
}

const STORAGE_KEY = 'oniceli_onboarding'

export function saveOnboardingData(data: OnboardingData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getOnboardingData(): OnboardingData | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OnboardingData
  } catch {
    return null
  }
}

export function clearOnboardingData() {
  localStorage.removeItem(STORAGE_KEY)
}

export async function persistOnboardingData(userId: string): Promise<void> {
  const data = getOnboardingData()
  if (!data || !userId) return

  const q = data.questionnaire

  if (data.role === 'supplier') {
    await createSupplier({
      name: q.name || 'Novo Fornecedor',
      categories: q.categories || '',
      contact: '',
      phone: '',
      email: '',
      products: JSON.stringify(q.categories ? q.categories.split(',') : []),
      delivery_lead_time: parseInt(q.deliveryLeadTime) || 3,
      rating: 0,
      status: 'active',
      user_id: userId,
    })
    await pb.collection('users').update(userId, {
      name: q.name || 'Novo Fornecedor',
      role: 'supplier',
    })
  } else {
    await pb.collection('users').update(userId, {
      name: q.name || 'Restaurante',
      role: 'restaurant',
    })
  }

  clearOnboardingData()
}
