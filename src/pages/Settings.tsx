import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Restaurante</h1>
        <p className="text-muted-foreground mt-1">
          Ajuste preferências do sistema, alertas da IA e dados da empresa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inteligência Artificial & Alertas</CardTitle>
          <CardDescription>Configure como a IA do Oniceli monitora sua operação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <Label>Sugestões Automáticas de Compra</Label>
              <span className="text-sm text-muted-foreground">
                Criar rascunhos de pedidos quando o estoque mínimo for atingido.
              </span>
            </div>
            <Switch defaultChecked id="ai-buy" />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <Label>Alertas de Desperdício (Shelf-life)</Label>
              <span className="text-sm text-muted-foreground">
                Notificar quando ingredientes estiverem a 3 dias do vencimento.
              </span>
            </div>
            <Switch defaultChecked id="ai-waste" />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <Label>Compartilhamento com Fornecedores</Label>
              <span className="text-sm text-muted-foreground">
                Permitir que fornecedores parceiros vejam previsão de demanda.
              </span>
            </div>
            <Switch id="supplier-share" />
          </div>

          <div className="pt-4 flex justify-end">
            <Button className="bg-emerald-600">Salvar Preferências</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
