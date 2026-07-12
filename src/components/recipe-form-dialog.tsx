import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, Calculator } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { createMenuItem, updateMenuItem, type MenuItem } from '@/services/menu-items'
import type { InventoryItem } from '@/services/inventory'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export interface RecipeIngredient {
  inventory_id: string
  name: string
  quantity: number
  unit: string
  unit_cost: number
}

interface RecipeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menuItem?: MenuItem | null
  inventoryItems: InventoryItem[]
  onSaved: () => void
}

export function RecipeFormDialog({
  open,
  onOpenChange,
  menuItem,
  inventoryItems,
  onSaved,
}: RecipeFormDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [active, setActive] = useState(true)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [margin, setMargin] = useState(65)
  const [selectedInvId, setSelectedInvId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (menuItem) {
      setName(menuItem.name)
      setCategory(menuItem.category || '')
      setActive(menuItem.active)
      setMargin(menuItem.margin || 65)
      try {
        const parsed = JSON.parse(menuItem.ingredients || '[]')
        setIngredients(
          parsed.map((ing: any) => {
            const inv = inventoryItems.find((i) => i.id === ing.inventory_id)
            return {
              inventory_id: ing.inventory_id,
              name: ing.name || inv?.name || 'Desconhecido',
              quantity: ing.quantity || 0,
              unit: ing.unit || inv?.unit || '',
              unit_cost: inv?.unit_cost || 0,
            }
          }),
        )
      } catch {
        setIngredients([])
      }
    } else {
      setName('')
      setCategory('')
      setActive(true)
      setIngredients([])
      setMargin(65)
    }
    setSelectedInvId('')
    setQuantity('')
  }, [open, menuItem])

  const totalCost = useMemo(
    () => ingredients.reduce((sum, ing) => sum + ing.quantity * ing.unit_cost, 0),
    [ingredients],
  )

  const suggestedPrice = useMemo(() => {
    const m = Math.min(Math.max(margin, 0), 99)
    return totalCost > 0 ? totalCost / (1 - m / 100) : 0
  }, [totalCost, margin])

  const addIngredient = () => {
    const inv = inventoryItems.find((i) => i.id === selectedInvId)
    if (!inv || !quantity) return
    setIngredients([
      ...ingredients,
      {
        inventory_id: inv.id,
        name: inv.name,
        quantity: parseFloat(quantity),
        unit: inv.unit,
        unit_cost: inv.unit_cost,
      },
    ])
    setSelectedInvId('')
    setQuantity('')
  }

  const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx))

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const ingredientsJson = JSON.stringify(
        ingredients.map(({ inventory_id, name, quantity, unit }) => ({
          inventory_id,
          name,
          quantity,
          unit,
        })),
      )
      const data = {
        name,
        category,
        active,
        ingredients: ingredientsJson,
        cost: Math.round(totalCost * 100) / 100,
        margin: Number(margin),
        price: Math.round(suggestedPrice * 100) / 100,
        user_id: user?.id,
      }
      if (menuItem) {
        await updateMenuItem(menuItem.id, data)
        toast({ title: 'Receita atualizada!' })
      } else {
        await createMenuItem(data)
        toast({ title: 'Receita criada!' })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{menuItem ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
          <DialogDescription>
            Crie fichas técnicas com cálculo automático de custos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nome do Prato</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arroz de Pato"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Prato Principal"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Switch checked={active} onCheckedChange={setActive} id="active" />
            <Label htmlFor="active">Ativo no cardápio</Label>
          </div>

          <div className="border-t pt-3 space-y-2">
            <Label className="text-sm font-semibold">Ingredientes</Label>
            {inventoryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Adicione itens ao estoque primeiro.</p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedInvId} onValueChange={setSelectedInvId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.name} ({inv.unit}) — R$ {inv.unit_cost}/{inv.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  className="w-24"
                  placeholder="Qtd"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addIngredient()
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={addIngredient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {ingredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{ing.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">
                      {ing.quantity} {ing.unit}
                    </Badge>
                    <span className="text-muted-foreground font-mono">
                      R$ {(ing.quantity * ing.unit_cost).toFixed(2)}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeIngredient(idx)}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-3 grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Calculator className="h-3 w-3" /> Custo Total
              </Label>
              <p className="text-lg font-mono font-semibold text-red-500">
                R$ {totalCost.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Margem (%)</Label>
              <Input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                min={0}
                max={99}
                step={0.1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preço Sugerido</Label>
              <p className="text-lg font-mono font-semibold text-emerald-600">
                R$ {suggestedPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
