import pb from '@/lib/pocketbase/client'

export const chatWithAssistant = (message: string, conversationId: string | null) =>
  pb.send('/backend/v1/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_id: conversationId }),
    headers: { 'Content-Type': 'application/json' },
  })

export const runInventoryMonitor = () =>
  pb.send('/backend/v1/agents/inventory-monitor', { method: 'GET' })

export const runWasteGuard = () => pb.send('/backend/v1/agents/waste-guard', { method: 'GET' })

export const runProfitAnalyst = () =>
  pb.send('/backend/v1/agents/profit-analyst', { method: 'GET' })

export const runPromoGenius = (context?: string) =>
  pb.send('/backend/v1/agents/promo-genius', {
    method: 'POST',
    body: JSON.stringify({ context: context || '' }),
    headers: { 'Content-Type': 'application/json' },
  })

export const runDemandForecaster = () =>
  pb.send('/backend/v1/agents/demand-forecaster', { method: 'GET' })
