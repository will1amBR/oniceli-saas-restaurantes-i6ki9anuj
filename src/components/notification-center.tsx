import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  MessageSquare,
  Monitor,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificationsStore } from '@/stores/notifications'
import { cn } from '@/lib/utils'

const priorityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-950/40' },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-950/40',
  },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-950/40' },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-950/40',
  },
}

const channelConfig = {
  internal: { icon: Monitor, label: 'Sistema' },
  push: { icon: Smartphone, label: 'Push' },
  sms: { icon: MessageSquare, label: 'SMS' },
  email: { icon: Monitor, label: 'E-mail' },
  whatsapp: { icon: Smartphone, label: 'WhatsApp' },
} as Record<string, { icon: any; label: string }>

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 min-w-4 px-1 items-center justify-center bg-red-500 text-[9px] text-white font-bold">
                {unreadCount}
              </span>
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Central de Notificações
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                <CheckCheck className="mr-1 h-3 w-3" />
                Marcar todas
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <Badge variant="secondary" className="text-[10px]">
              <Monitor className="mr-1 h-3 w-3" /> Sistema
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <Smartphone className="mr-1 h-3 w-3" /> WhatsApp
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              <MessageSquare className="mr-1 h-3 w-3" /> E-mail
            </Badge>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {notifications.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma notificação no momento.
              </p>
            )}
            {notifications.map((n) => {
              const config = priorityConfig[n.priority]
              const channel = channelConfig[n.channel]
              const Icon = config.icon
              const ChannelIcon = channel.icon
              return (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={cn(
                    'flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50',
                    !n.read && 'bg-primary/5 border-primary/20',
                  )}
                >
                  <div className={cn('rounded-lg p-2 shrink-0', config.bg)}>
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-tight">{n.title}</h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-tight">{n.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[9px] gap-1 py-0 px-1.5">
                        <ChannelIcon className="h-2.5 w-2.5" />
                        {channel.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/70">{n.timestamp}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
