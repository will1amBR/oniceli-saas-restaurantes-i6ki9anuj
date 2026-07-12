import { BookOpen, Plus, ChefHat, Info } from 'lucide-react'
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
import { mockRecipes } from '@/lib/data'
import { Progress } from '@/components/ui/progress'

export default function Recipes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fichas Técnicas (Receitas)</h1>
          <p className="text-muted-foreground mt-1">
            Padronize pratos e calcule custos exatos por porção.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="mr-2 h-4 w-4" /> Nova Ficha
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {mockRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className="hover:border-emerald-500/50 transition-colors flex flex-col"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="secondary" className="mb-2 bg-slate-100 text-slate-800">
                    {recipe.category}
                  </Badge>
                  <CardTitle className="text-xl">{recipe.name}</CardTitle>
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
                    R$ {recipe.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Preço Sugerido</p>
                  <p className="text-lg font-mono font-semibold text-slate-900 dark:text-slate-100">
                    R$ {recipe.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    Margem Operacional
                    <Info className="h-3 w-3 ml-1 text-muted-foreground/50" />
                  </span>
                  <span className="font-medium text-emerald-600">{recipe.margin}%</span>
                </div>
                <Progress
                  value={recipe.margin}
                  className="h-2"
                  indicatorClassName={recipe.margin >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}
                />
              </div>
            </CardContent>
            <CardFooter className="pt-0 border-t mt-4 p-4 gap-2">
              <Button variant="outline" className="w-full" size="sm">
                <ChefHat className="mr-2 h-4 w-4" />
                Ingredientes
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                Modo de Preparo
              </Button>
            </CardFooter>
          </Card>
        ))}

        <Card className="border-dashed bg-muted/20 hover:bg-muted/50 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer min-h-[300px]">
          <div className="rounded-full bg-emerald-100 p-3 mb-4">
            <Plus className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-lg mb-1">Criar Nova Ficha</CardTitle>
          <CardDescription>
            Use IA para ajudar a balancear porções e sugerir preços automaticamente.
          </CardDescription>
        </Card>
      </div>
    </div>
  )
}
