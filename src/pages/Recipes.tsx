import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, ChefHat, Loader2, Eye } from 'lucide-react'
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
import { RecipeDetailDialog } from '@/components/recipe-detail-dialog'
import { cn } from '@/lib/utils'

export default function Recipes() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<MenuItem[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<MenuItem | null>(null)
  const [detailRecipe, setDetailRecipe] = useState<MenuItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

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
  const openDetail = (recipe: MenuItem) => {
    setDetailRecipe(recipe)
    setDetailOpen(true)
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Receitas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas receitas e fichas técnicas com custos, ingredientes e margens de lucro.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova Receita
        </Button>
      </div>
      {recipes.length === 0 && !loading ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum item no cardápio</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Você ainda não cadastrou nenhum item no menu. Crie sua primeira ficha técnica para
              começar.
            </p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      ) : (
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
              <CardFooter className="pt-0 border-t mt-4 p-4">
                <div className="flex items-center gap-1 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 min-w-0 gap-1 text-xs h-8 px-2 justify-center overflow-hidden"
                    onClick={() => openDetail(recipe)}
                  >
                    <Eye className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Ficha</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-0 gap-1 text-xs h-8 px-2 justify-center overflow-hidden"
                    onClick={() => openEdit(recipe)}
                  >
                    <Edit className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Editar</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 min-w-0 gap-1 text-xs h-8 px-2 justify-center overflow-hidden text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(recipe.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Excluir</span>
                  </Button>
                </div>
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
            <CardTitle className="text-lg mb-1">Criar Novo Item</CardTitle>
            <CardDescription>
              Use o motor de custos para calcular o preço ideal automaticamente.
            </CardDescription>
          </Card>
        </div>
      )}

      <RecipeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        menuItem={editingRecipe}
        inventoryItems={inventory}
        onSaved={loadData}
      />
      <RecipeDetailDialog
        recipe={detailRecipe}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        inventoryItems={inventory}
      />
    </div>
  )
}
