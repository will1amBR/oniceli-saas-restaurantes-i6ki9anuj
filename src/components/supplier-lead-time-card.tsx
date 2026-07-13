import { useState } from 'react'
import { Clock, Edit, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { updateSupplier, type Supplier } from '@/services/suppliers'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  supplier: Supplier
  onUpdated: () => void
}

export function SupplierLeadTimeCard({ supplier, onUpdated }: Props) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(supplier.delivery_lead_time || 0))

  const handleSave = async () => {
    try {
      await updateSupplier(supplier.id, { delivery_lead_time: parseInt(value) || 0 })
      toast({ title: 'Tempo de reposição atualizado!' })
      setEditing(false)
      onUpdated()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const handleCancel = () => {
    setValue(String(supplier.delivery_lead_time || 0))
    setEditing(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5 text-emerald-600" /> Tempo de Reposição
        </CardTitle>
        {!editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit className="mr-1 h-3.5 w-3.5" /> Editar
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">dias</span>
            <Button size="sm" onClick={handleSave} className="bg-emerald-600">
              <Check className="mr-1 h-4 w-4" /> Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">
              {supplier.delivery_lead_time || 0}
            </span>
            <span className="text-sm text-muted-foreground">
              dias úteis para reposição de estoque
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
