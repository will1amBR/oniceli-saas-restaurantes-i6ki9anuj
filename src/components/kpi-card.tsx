import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowDownIcon, ArrowUpIcon, type LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  icon?: LucideIcon
  trend?: { value: string; positive: boolean; label: string }
  variant?: 'default' | 'success' | 'warning' | 'danger'
  subtitle?: string
}

const variantStyles: Record<string, string> = {
  default: '',
  success: 'border-l-4 border-l-emerald-500',
  warning: 'border-l-4 border-l-amber-500',
  danger: 'border-l-4 border-l-red-500',
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  subtitle,
}: KPICardProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
      </CardHeader>
      <CardContent>
        <div className="text-xl md:text-2xl font-bold font-mono truncate">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {trend.positive ? (
              <ArrowUpIcon className="mr-1 h-3 w-3 text-emerald-500 shrink-0" />
            ) : (
              <ArrowDownIcon className="mr-1 h-3 w-3 text-red-500 shrink-0" />
            )}
            <span
              className={cn('font-medium', trend.positive ? 'text-emerald-500' : 'text-red-500')}
            >
              {trend.value}
            </span>
            <span className="ml-1 truncate">{trend.label}</span>
          </p>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
