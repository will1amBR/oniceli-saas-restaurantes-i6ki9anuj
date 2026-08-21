import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Ocorreu um erro ao carregar os dados',
  message = 'Não foi possível buscar as informações no momento. Verifique sua conexão e tente novamente.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <Card
      className={`border-dashed border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 text-center py-10 px-4 rounded-2xl ${className}`}
    >
      <CardContent className="space-y-3 max-w-md mx-auto">
        <div className="p-3.5 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 w-fit mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-bold text-base text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="gap-2 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 font-bold text-xs mt-2"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
export default ErrorState
