import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChefHat, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { persistOnboardingData } from '@/services/onboarding'
import pb from '@/lib/pocketbase/client'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signUp, isAuthenticated } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const run = async () => {
        try {
          await persistOnboardingData(pb.authStore.record?.id || '')
        } catch {
          /* ignore persistence errors */
        }
        navigate('/dashboard')
      }
      run()
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = isSignUp ? await signUp(email, password, name) : await signIn(email, password)
    if (result.error) {
      setError(getErrorMessage(result.error))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-3">
              <ChefHat className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">{isSignUp ? 'Criar Conta' : 'Bem-vindo'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Cadastre-se no Oniceli' : 'Entre na sua conta Oniceli'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="min-h-[44px]"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="min-h-[44px]"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? 'Cadastrar' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
            </button>
          </div>
          <div className="mt-2 text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:underline">
              ← Voltar ao início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
