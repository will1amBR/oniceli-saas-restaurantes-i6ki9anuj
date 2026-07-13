import { useState, useEffect } from 'react'
import { Banknote, User, Building2, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { updateSupplier, parseBankInfo, type Supplier, type BankInfo } from '@/services/suppliers'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  supplier: Supplier
  onUpdated: () => void
}

export function SupplierPaymentProfile({ supplier, onUpdated }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    recipient_name: '',
    bank: '',
    agency: '',
    account: '',
    account_type: '',
  })
  const [taxId, setTaxId] = useState('')
  const [pixKey, setPixKey] = useState('')

  useEffect(() => {
    setBankInfo(parseBankInfo(supplier.bank_account_info))
    setTaxId(supplier.tax_id || '')
    setPixKey(supplier.pix_key || '')
  }, [supplier])

  const handleSave = async () => {
    try {
      await updateSupplier(supplier.id, {
        bank_account_info: JSON.stringify(bankInfo),
        tax_id: taxId,
        pix_key: pixKey,
      })
      toast({ title: 'Dados de pagamento salvos!' })
      onUpdated()
      setOpen(false)
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const info = parseBankInfo(supplier.bank_account_info)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-600" /> Quem vai receber
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Edit className="mr-1 h-4 w-4" /> Editar
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>
            Beneficiário: <strong>{info.recipient_name || supplier.name || '-'}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>CNPJ/CPF: {supplier.tax_id || '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-muted-foreground" />
          <span>Pix: {supplier.pix_key || '-'}</span>
        </div>
        {info.bank && (
          <div className="text-muted-foreground">
            Banco: {info.bank} • Ag: {info.agency} • Conta: {info.account} ({info.account_type})
          </div>
        )}
      </CardContent>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Dados de Pagamento</DialogTitle>
            <DialogDescription>Configure quem recebe os pagamentos.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-1">
              <Label>Nome do Beneficiário</Label>
              <Input
                value={bankInfo.recipient_name}
                onChange={(e) => setBankInfo({ ...bankInfo, recipient_name: e.target.value })}
              />
            </div>
            <div className="grid gap-1">
              <Label>CPF / CNPJ</Label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="grid gap-1">
              <Label>Chave Pix</Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="email, telefone, CPF ou aleatória"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Banco</Label>
                <Input
                  value={bankInfo.bank}
                  onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Agência</Label>
                <Input
                  value={bankInfo.agency}
                  onChange={(e) => setBankInfo({ ...bankInfo, agency: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label>Conta</Label>
                <Input
                  value={bankInfo.account}
                  onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>Tipo</Label>
                <Input
                  value={bankInfo.account_type}
                  onChange={(e) => setBankInfo({ ...bankInfo, account_type: e.target.value })}
                  placeholder="Corrente / Poupança"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSave} className="bg-emerald-600">
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
