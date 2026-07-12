import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  healthy: { label: 'Adequado', className: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  warning: { label: 'Atenção', className: 'bg-amber-500 hover:bg-amber-600 text-white' },
  critical: { label: 'Crítico', className: 'bg-red-500 hover:bg-red-600 text-white' },
  expired: { label: 'Vencido', className: 'bg-red-700 hover:bg-red-800 text-white' },
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const config = statusConfig[status]
  if (!config) return <Badge variant="outline">{label || 'Desconhecido'}</Badge>
  return <Badge className={cn(config.className)}>{label || config.label}</Badge>
}
