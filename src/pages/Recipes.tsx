import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, ChefHat, Loader2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getMenuItems, deleteMenuItem, type MenuItem } from '@/services/menu-items'
import { getInventory, type InventoryItem } from '@/services/inventory'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { RecipeFormDialog } from '@/components/recipe-form-dialog'
import { cn } from '@/lib/utils'

export default function Recipes() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<MenuItem[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<MenuItem | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [items, inv] = await Promise.all([getMenuItems(), getInventory()])
      setRecipes(items)
      setInventory(inv)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])
  useRealtime('menu_items', () => loadData())

  const openCreate = () => {
    setEditingRecipe(null)
    setDialogOpen(true)
  }
  const openEdit = (recipe: MenuItem) => {
    setEditingRecipe(recipe)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuItem(id)
      toast({ title: 'Receita excluída!' })
      loadData()
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const getIngredientCount = (recipe: MenuItem) => {
    try {
      return JSON.parse(recipe.ingredients || '[]').length
    } catch {
      return 0
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Fichas Técnicas (Receitas)
          </h1>
          <p className="text-muted-foreground mt-1">
            Padronize pratos e calcule custos exatos por porção com IA.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ficha
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {recipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="hover:border-emerald-500/50 transition-colors flex flex-col"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="mb-2 bg-slate-100 text-slate-800">
                    {recipe.category || 'Sem categoria'}
                  </Badge>
                  <CardTitle className="text-xl">{recipe.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1">
                    <ChefHat className="h-3 w-3" /> {getIngredientCount(recipe)} ingrediente(s)
                  </CardDescription>
                </div>
                {recipe.active && (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                    Ativo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Custo por Porção</p>
                  <p className="text-lg font-mono font-medium text-red-500">
                    R$ {(recipe.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Preço de Venda</p>
                  <p className="text-lg font-mono font-semibold text-slate-900 dark:text-slate-100">
                    R$ {(recipe.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Margem Operacional</span>
                  <span className="font-medium text-emerald-600">
                    {(recipe.margin || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (recipe.margin || 0) >= 70 ? 'bg-emerald-500' : 'bg-amber-500',
                    )}
                    style={{ width: `${Math.min(recipe.margin || 0, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0 border-t mt-4 p-4 gap-2">
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => openEdit(recipe)}
              >
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700"
                size="sm"
                onClick={() => handleDelete(recipe.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </Button>
            </CardFooter>
          </Card>
        ))}

        <Card
          className="border-dashed bg-muted/20 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer min-h-[300px]"
          onClick={openCreate}
        >
          <div className="rounded-full bg-emerald-100 p-3 mb-4">
            <Plus className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-lg mb-1">Criar Nova Ficha</CardTitle>
          <CardDescription>
            Use o motor de custos para calcular o preço ideal automaticamente.
          </CardDescription>
        </Card>
      </div>

      <RecipeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        menuItem={editingRecipe}
        inventoryItems={inventory}
        onSaved={loadData}
      />
    </div>
  )
}
