import { useState, useEffect } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createUser, updateUser, type User } from '@/services/users'
import { getErrorMessage, extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editUser: User | null
  onSaved: () => void
}

export function UserFormDialog({ open, onOpenChange, editUser, onSaved }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<string>('restaurant')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setFieldErrors({})
    if (editUser) {
      setName(editUser.name || '')
      setEmail(editUser.email || '')
      setRole(editUser.role || 'restaurant')
      setPassword('')
    } else {
      setName('')
      setEmail('')
      setPassword('')
      setRole('restaurant')
    }
  }, [open, editUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    setSubmitting(true)
    try {
      if (editUser) {
        await updateUser(editUser.id, { name, email, role })
        toast({ title: 'Usuário atualizado!' })
      } else {
        await createUser({ name, email, password, passwordConfirm: password, role })
        toast({ title: 'Usuário criado!' })
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setFieldErrors(extractFieldErrors(err))
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{editUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {editUser
              ? 'Atualize os dados do usuário.'
              : 'Preencha os dados para criar um novo usuário.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && <p className="text-sm text-red-500">{fieldErrors.name}</p>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && <p className="text-sm text-red-500">{fieldErrors.email}</p>}
            </div>
            {!editUser && (
              <div className="grid gap-1.5">
                <Label htmlFor="user-password">Senha</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
                {fieldErrors.password && (
                  <p className="text-sm text-red-500">{fieldErrors.password}</p>
                )}
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="user-role">Perfil</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="user-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurante</SelectItem>
                  <SelectItem value="supplier">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.role && <p className="text-sm text-red-500">{fieldErrors.role}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
