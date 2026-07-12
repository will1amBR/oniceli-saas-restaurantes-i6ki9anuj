import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createWasteLog } from '@/services/waste-logs'
import type { InventoryItem } from '@/services/inventory'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  userId: string
  onSaved: () => void
}

export function WasteLogDialog({ open, onOpenChange, item, userId, onSaved }: Props) {
  const [formData, setFormData] = useState({ quantity: 0, reason: '', financial_loss: 0, date: '' })

  useEffect(() => {
    if (item && open) {
      const loss = item.unit_cost * 1
      setFormData({
        quantity: 1,
        reason: '',
        financial_loss: loss,
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    await createWasteLog({
      item_id: item.id,
      quantity: formData.quantity,
      reason: formData.reason,
      financial_loss: formData.financial_loss,
      date: formData.date,
      user_id: userId,
    })
    onSaved()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Desperdício</DialogTitle>
          <DialogDescription>{item?.name} — registre a perda.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Qtd</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })
                }
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Motivo</Label>
              <Select
                value={formData.reason}
                onValueChange={(v) => setFormData({ ...formData, reason: v })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vencimento">Vencimento</SelectItem>
                  <SelectItem value="Preparação">Preparação</SelectItem>
                  <SelectItem value="Deterioração">Deterioração</SelectItem>
                  <SelectItem value="Quebra">Quebra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Perda R$</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.financial_loss}
                onChange={(e) =>
                  setFormData({ ...formData, financial_loss: parseFloat(e.target.value) || 0 })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-right">Data</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-emerald-600">
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
