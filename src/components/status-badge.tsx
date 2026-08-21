import { Badge } from '@/components/ui/badge'
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Check,
  Flame,
  XCircle,
  Hourglass,
} from 'lucide-react'

export type StatusType =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'confirmed'
  | 'shipped'
  | 'cancelled'
  | 'active'
  | 'inactive'
  | 'paid'
  | 'overdue'

interface StatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ComponentType<{ className?: string }> }
> = {
  // Kitchen & Bar order statuses
  pending: {
    label: 'Pendente',
    className:
      'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    icon: Clock,
  },
  preparing: {
    label: 'Em Preparo',
    className:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 animate-pulse',
    icon: Flame,
  },
  ready: {
    label: 'Pronto',
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  delivered: {
    label: 'Entregue',
    className:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800',
    icon: Check,
  },

  // Purchase / Supplier order statuses
  enviado: {
    label: 'Enviado',
    className:
      'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    icon: Truck,
  },
  em_processamento: {
    label: 'Em Processamento',
    className:
      'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    icon: Hourglass,
  },
  confirmed: {
    label: 'Confirmado',
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  shipped: {
    label: 'A Caminho',
    className:
      'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    icon: Truck,
  },
  entregue: {
    label: 'Entregue',
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelado',
    className:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    icon: XCircle,
  },

  // Stock / Item Active Statuses
  active: {
    label: 'Ativo',
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  inactive: {
    label: 'Inativo',
    className:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
    icon: XCircle,
  },

  // Financial Statuses
  paid: {
    label: 'Pago',
    className:
      'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  overdue: {
    label: 'Vencido',
    className:
      'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    icon: AlertCircle,
  },
}

export function StatusBadge({ status, className = '', showIcon = true }: StatusBadgeProps) {
  const normalizedKey = (status || '').toLowerCase().replace('-', '_').trim()
  const config = statusConfig[normalizedKey] || {
    label: status || 'Desconhecido',
    className: 'bg-muted text-muted-foreground border-border',
    icon: Clock,
  }

  const IconComp = config.icon

  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${config.className} ${className}`}
    >
      {showIcon && <IconComp className="h-3.5 w-3.5 shrink-0" />}
      <span className="leading-none">{config.label}</span>
    </Badge>
  )
}
export default StatusBadge
