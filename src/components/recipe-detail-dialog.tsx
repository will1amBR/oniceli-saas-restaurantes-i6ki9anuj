import { useState, useMemo } from 'react'
import { Eye, ChefHat, DollarSign, TrendingUp, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MenuItem } from '@/services/menu-items'
import type { InventoryItem } from '@/services/inventory'

export interface RecipeIngredient {
  inventory_id: string
  name: string
  quantity: number
  unit: string
}

interface RecipeDetailDialogProps {
  recipe: MenuItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  inventoryItems: InventoryItem[]
}

export function RecipeDetailDialog({
  recipe,
  open,
  onOpenChange,
  inventoryItems,
}: RecipeDetailDialogProps) {
  const ingredients = useMemo<RecipeIngredient[]>(() => {
    if (!recipe) return []
    try {
      return JSON.parse(recipe.ingredients || '[]')
    } catch {
      return []
    }
  }, [recipe])

  const enrichedIngredients = useMemo(() => {
    return ingredients.map((ing) => {
      const inv = inventoryItems.find((i) => i.id === ing.inventory_id)
      const unitCost = inv?.unit_cost || 0
      return {
        ...ing,
        unit_cost: unitCost,
        total_cost: ing.quantity * unitCost,
      }
    })
  }, [ingredients, inventoryItems])

  const totalCost = useMemo(
    () => enrichedIngredients.reduce((sum, ing) => sum + ing.total_cost, 0),
    [enrichedIngredients],
  )

  const profit = recipe ? (recipe.price || 0) - totalCost : 0
  const margin = recipe ? recipe.margin || 0 : 0

  if (!recipe) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
              <ChefHat className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">{recipe.name}</DialogTitle>
              <DialogDescription>Ficha Técnica completa do prato</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-slate-100 text-slate-800">
              {recipe.category || 'Sem categoria'}
            </Badge>
            {recipe.active && (
              <Badge className="bg-emerald-100 text-emerald-700 border-none">Ativo</Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <DollarSign className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Custo Produção</p>
              <p className="text-lg font-mono font-semibold text-red-500">
                R$ {totalCost.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Package className="h-4 w-4 text-slate-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Preço de Venda</p>
              <p className="text-lg font-mono font-semibold text-slate-900 dark:text-slate-100">
                R$ {(recipe.price || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <TrendingUp className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Lucro / Margem</p>
              <p className="text-lg font-mono font-semibold text-emerald-600">
                R$ {profit.toFixed(2)}
              </p>
              <p className="text-[10px] text-muted-foreground">{margin.toFixed(1)}% margem</p>
            </div>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ingrediente</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Custo Unit.</TableHead>
                  <TableHead className="text-right">Custo Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedIngredients.map((ing, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{ing.name}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {ing.quantity} {ing.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      R$ {ing.unit_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      R$ {ing.total_cost.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {enrichedIngredients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                      Nenhum ingrediente cadastrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center border-t pt-3">
            <span className="text-sm font-semibold">Custo Total de Produção</span>
            <span className="text-xl font-mono font-bold text-red-500">
              R$ {totalCost.toFixed(2)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
