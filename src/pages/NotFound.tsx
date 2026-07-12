import { useLocation, Link } from 'react-router-dom'
import { useEffect } from 'react'

const NotFound = () => {
  const location = useLocation()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-muted-foreground mb-4">
          Oops! Página não encontrada
        </p>
        <Link to="/" className="text-emerald-600 hover:text-emerald-700 underline">
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}

export default NotFound
