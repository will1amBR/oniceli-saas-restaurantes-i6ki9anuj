import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChefHat,
  Loader2,
  Store,
  Truck,
  UtensilsCrossed,
  UserCheck,
  Wine,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Smartphone,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { persistOnboardingData, getOnboardingData } from '@/services/onboarding'
import pb from '@/lib/pocketbase/client'

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { signIn, signUp, isAuthenticated } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Real-time validation touched state
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [nameTouched, setNameTouched] = useState(false)

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSuccess, setForgotSuccess] = useState(false)

  // Validation rules
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isEmailValid = emailRegex.test(email)
  const isPasswordValid = password.length >= 8
  const isNameValid = !isSignUp || name.trim().length >= 2

  useEffect(() => {
    if (isAuthenticated) {
      const run = async () => {
        const currentUser = pb.authStore.record
        const userRole = (currentUser as any)?.role
        if (!userRole) {
          navigate('/onboarding')
          return
        }
        const onboardingData = getOnboardingData()
        if (onboardingData) {
          try {
            await persistOnboardingData(currentUser?.id || '')
          } catch {
            /* ignore */
          }
        }

        if (userRole === 'supplier') {
          navigate('/supplier/dashboard')
        } else if (userRole === 'kitchen') {
          navigate('/cozinha')
        } else if (userRole === 'bar') {
          navigate('/bar')
        } else if (userRole === 'waiter') {
          navigate('/garcom')
        } else {
          // 'restaurant' ou outros
          navigate('/dashboard')
        }
      }
      run()
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setEmailTouched(true)
    setPasswordTouched(true)
    if (isSignUp) setNameTouched(true)

    if (!isEmailValid) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    if (!isPasswordValid) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (isSignUp && !isNameValid) {
      setError('Por favor, informe o seu nome ou o nome do restaurante.')
      return
    }

    setLoading(true)
    const result = isSignUp ? await signUp(email, password, name) : await signIn(email, password)
    if (result.error) {
      setError(getErrorMessage(result.error))
      setLoading(false)
    } else {
      toast({
        title: isSignUp ? 'Conta criada!' : 'Login realizado com sucesso!',
        description: 'Bem-vindo ao Oniceli.',
        className: 'bg-emerald-600 text-white font-bold',
      })
    }
  }

  const demoLogin = async (demoEmail: string, demoPassword: string = 'Skip@Pass') => {
    setError('')
    setLoading(true)
    setEmail(demoEmail)
    setPassword(demoPassword)
    const result = await signIn(demoEmail, demoPassword)
    if (result.error) {
      setError(getErrorMessage(result.error))
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !emailRegex.test(forgotEmail)) {
      toast({
        title: 'E-mail inválido',
        description: 'Digite um endereço de e-mail válido para a recuperação.',
        variant: 'destructive',
      })
      return
    }
    setForgotLoading(true)
    try {
      await pb.collection('users').requestPasswordReset(forgotEmail.trim())
      setForgotSuccess(true)
      toast({
        title: 'Instruções enviadas!',
        description: `Se o e-mail estiver cadastrado, enviamos o link de recuperação para ${forgotEmail}.`,
        className: 'bg-emerald-600 text-white font-bold',
      })
    } catch {
      // For security reasons, don't leak user existence
      setForgotSuccess(true)
      toast({
        title: 'Instruções enviadas!',
        description: `Se o e-mail estiver cadastrado, enviamos o link de recuperação para ${forgotEmail}.`,
      })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900/10 via-background to-teal-900/10 p-4 sm:p-6 selection:bg-emerald-500 selection:text-white">
      {/* Client Quick Access Banner */}
      <div className="w-full max-w-md mb-4 animate-fade-in-up">
        <Link
          to="/cardapio"
          className="group flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.01]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center font-bold">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm flex items-center gap-1.5">
                É cliente da mesa?
                <span className="text-[10px] uppercase font-bold bg-white text-emerald-800 px-1.5 py-0.2 rounded-full">
                  Sem Login
                </span>
              </p>
              <p className="text-xs text-emerald-100">
                Acesse o Cardápio Digital e faça seu pedido
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <Card className="w-full max-w-md border-border/60 shadow-xl rounded-2xl backdrop-blur bg-card/95 animate-fade-in-up">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 ring-4 ring-emerald-500/10">
              <ChefHat className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">
            {isSignUp ? 'Criar Conta no Oniceli' : 'Bem-vindo de volta!'}
          </CardTitle>
          <CardDescription className="text-sm">
            {isSignUp
              ? 'Comece a transformar a gestão do seu restaurante hoje'
              : 'Entre com suas credenciais para acessar o painel'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold">
                  Nome do Responsável / Restaurante
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (!nameTouched) setNameTouched(true)
                    }}
                    onBlur={() => setNameTouched(true)}
                    placeholder="Ex: Carlos Silva ou Serena Café"
                    className={`pl-10 min-h-[44px] rounded-xl ${
                      nameTouched && !isNameValid
                        ? 'border-red-500 focus-visible:ring-red-400'
                        : nameTouched && isNameValid
                          ? 'border-emerald-500'
                          : ''
                    }`}
                  />
                </div>
                {nameTouched && !isNameValid && (
                  <p className="text-[11px] text-red-500 font-medium">
                    O nome deve ter no mínimo 2 letras.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold">
                E-mail Corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (!emailTouched) setEmailTouched(true)
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="voce@restaurante.com.br"
                  required
                  className={`pl-10 min-h-[44px] rounded-xl ${
                    emailTouched && !isEmailValid && email
                      ? 'border-red-500 focus-visible:ring-red-400'
                      : emailTouched && isEmailValid
                        ? 'border-emerald-500'
                        : ''
                  }`}
                />
              </div>
              {emailTouched && !isEmailValid && email && (
                <p className="text-[11px] text-red-500 font-medium">
                  Insira um e-mail válido (ex: contato@exemplo.com).
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold">
                  Senha
                </Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotSuccess(false)
                      setForgotModalOpen(true)
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (!passwordTouched) setPasswordTouched(true)
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="••••••••"
                  required
                  className={`pl-10 pr-10 min-h-[44px] rounded-xl ${
                    passwordTouched && !isPasswordValid && password
                      ? 'border-red-500 focus-visible:ring-red-400'
                      : passwordTouched && isPasswordValid
                        ? 'border-emerald-500'
                        : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordTouched && !isPasswordValid && password && (
                <p className="text-[11px] text-red-500 font-medium">
                  A senha deve conter pelo menos 8 caracteres.
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-start gap-2">
                <span className="shrink-0 mt-0.5 font-bold">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[46px] rounded-xl text-sm shadow-md shadow-emerald-600/20"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Criar Minha Conta Grátis' : 'Entrar no Sistema'}
            </Button>
          </form>

          <div className="text-center text-xs pt-1">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-muted-foreground hover:text-emerald-600 font-medium transition-colors"
            >
              {isSignUp ? (
                <span>
                  Já possui uma conta?{' '}
                  <strong className="text-emerald-600 underline">Faça login</strong>
                </span>
              ) : (
                <span>
                  Não tem conta ainda?{' '}
                  <strong className="text-emerald-600 underline">Cadastre-se gratuitamente</strong>
                </span>
              )}
            </button>
          </div>

          {/* Quick Demo Logins Grid */}
          {!isSignUp && (
            <div className="pt-4 border-t border-border/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Acesso rápido de demonstração:
                </p>
                <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50">
                  1-Click Demo
                </Badge>
              </div>

              {/* Serena Main */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => demoLogin('serena@teste.com.br', 'Skip@Pass')}
                disabled={loading}
                className="w-full gap-2 min-h-[40px] border-emerald-400/70 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 dark:bg-emerald-950/20 font-bold rounded-xl"
              >
                <ChefHat className="h-4 w-4 text-emerald-600" /> Serena Café (Restaurante Completo)
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('cozinha@demo.oniceli.com')}
                  disabled={loading}
                  className="gap-1.5 text-xs rounded-xl min-h-[38px] justify-start"
                >
                  <UtensilsCrossed className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">Cozinha (KDS)</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('bar@demo.oniceli.com')}
                  disabled={loading}
                  className="gap-1.5 text-xs rounded-xl min-h-[38px] justify-start"
                >
                  <Wine className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">Bar & Doses</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('garcom@demo.oniceli.com')}
                  disabled={loading}
                  className="gap-1.5 text-xs rounded-xl min-h-[38px] justify-start"
                >
                  <UserCheck className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">Garçom</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => demoLogin('fornecedor@demo.oniceli.com')}
                  disabled={loading}
                  className="gap-1.5 text-xs rounded-xl min-h-[38px] justify-start"
                >
                  <Truck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">Fornecedor</span>
                </Button>
              </div>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              ← Voltar à página inicial
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <div className="mx-auto p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 w-fit mb-2">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-center">Recuperar Senha</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Informe seu e-mail cadastrado para receber o link de redefinição de senha.
            </DialogDescription>
          </DialogHeader>

          {forgotSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 rounded-full w-fit mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="font-bold text-base text-foreground">Verifique sua caixa de entrada!</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Enviamos as orientações de redefinição para <strong>{forgotEmail}</strong>.
              </p>
              <Button
                onClick={() => setForgotModalOpen(false)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 rounded-xl"
              >
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-bold">
                  E-mail de Cadastro
                </Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11 rounded-xl"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading || !forgotEmail}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  {forgotLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar Link de Recuperação
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
