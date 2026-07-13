import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { updateSupplier, type ProductEntry } from '@/services/suppliers'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplierId: string
  existingProducts: ProductEntry[]
  onImported: () => void
}

const targetFields = [
  { key: 'name', label: 'Nome do Produto' },
  { key: 'price', label: 'Preço' },
  { key: 'sku', label: 'SKU' },
  { key: 'fiscal_code', label: 'Código Fiscal' },
  { key: 'category', label: 'Categoria' },
]

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') {
        current.push(field)
        field = ''
      } else if (c === '\n') {
        current.push(field)
        rows.push(current)
        current = []
        field = ''
      } else if (c !== '\r') field += c
    }
  }
  if (field || current.length) {
    current.push(field)
    rows.push(current)
  }
  return rows.filter((r) => r.some((c) => c.trim()))
}

function autoMap(headers: string[]): Record<string, number> {
  const m: Record<string, number> = {}
  headers.forEach((h, i) => {
    const l = h.toLowerCase()
    if (l.includes('nome') || l.includes('produto')) m.name = i
    else if (l.includes('pre') || l.includes('valor') || l.includes('price')) m.price = i
    else if (l.includes('sku')) m.sku = i
    else if (l.includes('fiscal') || l.includes('codigo')) m.fiscal_code = i
    else if (l.includes('categ')) m.category = i
  })
  return m
}

export function SupplierBulkImport({
  open,
  onOpenChange,
  supplierId,
  existingProducts,
  onImported,
}: Props) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [errors, setErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<ProductEntry[]>([])

  const validate = (rows: string[][], map: Record<string, number>) => {
    const errs: string[] = []
    const existingSkus = new Set(existingProducts.filter((p) => p.sku).map((p) => p.sku))
    const seenSkus = new Set<string>()
    const products: ProductEntry[] = []
    if (map.name === undefined) errs.push('Coluna "Nome do Produto" não mapeada.')
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const name = map.name !== undefined ? row[map.name]?.trim() : ''
      if (!name) {
        errs.push(`Linha ${i + 1}: nome vazio.`)
        continue
      }
      const sku = map.sku !== undefined ? row[map.sku]?.trim() : ''
      if (sku) {
        if (existingSkus.has(sku)) {
          errs.push(`Linha ${i + 1}: SKU "${sku}" já existe.`)
          continue
        }
        if (seenSkus.has(sku)) {
          errs.push(`Linha ${i + 1}: SKU "${sku}" duplicado.`)
          continue
        }
        seenSkus.add(sku)
      }
      products.push({
        name,
        sku: sku || undefined,
        price: map.price !== undefined ? parseFloat(row[map.price]) || undefined : undefined,
        fiscal_code:
          map.fiscal_code !== undefined ? row[map.fiscal_code]?.trim() || undefined : undefined,
        category: map.category !== undefined ? row[map.category]?.trim() || undefined : undefined,
      })
    }
    setErrors(errs)
    setPreview(products)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rows = parseCSV(String(reader.result))
      if (rows.length < 2) {
        toast({
          title: 'Arquivo vazio',
          description: 'O CSV precisa ter cabeçalho e dados.',
          variant: 'destructive',
        })
        return
      }
      setCsvData(rows)
      const m = autoMap(rows[0])
      setMapping(m)
      validate(rows, m)
    }
    reader.readAsText(file)
  }

  const handleMapChange = (key: string, value: string) => {
    const newMap = { ...mapping, [key]: parseInt(value) }
    setMapping(newMap)
    validate(csvData, newMap)
  }

  const handleImport = async () => {
    if (errors.length > 0) {
      toast({ title: 'Corrija os erros', variant: 'destructive' })
      return
    }
    try {
      const all = [...existingProducts, ...preview]
      await updateSupplier(supplierId, { products: JSON.stringify(all) })
      toast({ title: `${preview.length} produtos importados!` })
      onImported()
      onOpenChange(false)
      setCsvData([])
      setPreview([])
      setErrors([])
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    }
  }

  const headers = csvData[0] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Planilha</DialogTitle>
          <DialogDescription>
            CSV com colunas: Nome, Preço, SKU, Código Fiscal, Categoria.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" /> Selecionar CSV
            </Button>
          </div>
          {headers.length > 0 && (
            <div className="space-y-2">
              <Label>Mapeamento de Colunas</Label>
              {targetFields.map((tf) => (
                <div key={tf.key} className="flex items-center gap-2">
                  <Label className="w-32 text-sm">{tf.label}</Label>
                  <Select
                    value={mapping[tf.key]?.toString() ?? ''}
                    onValueChange={(v) => handleMapChange(tf.key, v)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione a coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
          {errors.length > 0 && (
            <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {e}
                </p>
              ))}
            </div>
          )}
          {preview.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.slice(0, 10).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku || '-'}</TableCell>
                    <TableCell className="text-right">
                      {p.price ? `R$ ${p.price.toFixed(2)}` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {preview.length > 0 && errors.length === 0 && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {preview.length} produtos válidos prontos para
              importar.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={preview.length === 0 || errors.length > 0}
          >
            Importar {preview.length > 0 ? `(${preview.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
