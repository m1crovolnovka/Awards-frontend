"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Snowflakes from "@/components/snowflakes"
import { categoryApi, api, userApi } from "@/lib/api"

interface Category {
  id: number
  name: string
  description?: string
  photoUrl?: string
}

interface VotingResults {
  [key: string]: {
    [key: string]: number
  }
}

export default function Home() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<VotingResults>({})
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginUsername, setLoginUsername] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  useEffect(() => {
    const userId = localStorage.getItem("id")
    const role = localStorage.getItem("role")
    
    if (userId) {
      setIsLoggedIn(true)
      if (role === "ADMIN") {
      setIsAdmin(true)
    }
    } else {
      setIsLoggedIn(false)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAll()
        console.log(response.data)
        setCategories(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()

    const stored = localStorage.getItem("votingResults")
    if (stored) {
      setResults(JSON.parse(stored))
    }
  }, [isLoggedIn])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    try {
      const response = await userApi.login(loginUsername, loginPassword)
      const data = response.data

      // Store auth token
      localStorage.setItem("id", data.id)
      localStorage.setItem("username", data.username)
      localStorage.setItem("role", data.role)
      localStorage.setItem("password", loginPassword)

      setIsLoggedIn(true)
      if (data.role === "ADMIN") {
        setIsAdmin(true)
      }
      
      // Reload categories
      setLoading(true)
      try {
        const response = await categoryApi.getAll()
        setCategories(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "An error occurred"
      setLoginError(message)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    // Очищаем весь localStorage
    localStorage.clear()
    setIsLoggedIn(false)
    setIsAdmin(false)
    setCategories([])
    router.push("/")
  }

  const getCategoryIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("student")) return "🎓"
    if (lowerName.includes("girl") || lowerName.includes("woman")) return "✨"
    if (lowerName.includes("meme")) return "😂"
    if (lowerName.includes("couple")) return "💑"
    if (lowerName.includes("friend")) return "👯"
    return "🏆"
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <Snowflakes />
        <Card className="w-full max-w-md border border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Вход в систему</CardTitle>
            <CardDescription className="text-center">Введите ваши данные для входа в аккаунт</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  required
                  disabled={loginLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={loginLoading}
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{loginError}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Вход..." : "Войти"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Snowflakes />

      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-2 flex-wrap">
        {isAdmin && (
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm text-xs sm:text-sm">
              Admin
            </Button>
          </Link>
        )}
        <Button 
          variant="outline" 
          size="sm"
          className="bg-card/80 backdrop-blur-sm text-xs sm:text-sm"
          onClick={handleLogout}
        >
          Выйти
          </Button>
      </div>

      <div className="relative overflow-hidden border-b border-accent/30 festive-header">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-balance text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground lg:text-5xl mb-2">
              Новогодняя премия 2025
            </h1>
            <p className="text-balance text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Официальное голосование за новогодние премии. Выберите номинантов и проголосуйте!
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка категорий...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Ошибка: {error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const totalVotes = Object.values(results[category.id] || {}).reduce((a, b) => a + b, 0)

              return (
                <Link key={category.id} href={`/nomination/${category.id}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-accent/70 cursor-pointer border border-border bg-card/60 hover:bg-card/80 backdrop-blur-sm overflow-hidden">
                    {category.photoUrl && (
                      <div className="w-full h-48 overflow-hidden bg-card border-b border-border">
                        <img 
                          src={category.photoUrl} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      {!category.photoUrl && <div className="text-4xl mb-3">{getCategoryIcon(category.name)}</div>}
                      <CardTitle className="text-xl text-foreground">{category.name}</CardTitle>
                      {category.description && (
                        <CardDescription className="mt-2">{category.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Посмотреть номинантов</span>
                        <span className="text-lg">→</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-card/40 backdrop-blur-sm mt-16">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">Новогодняя премия • Все права защищены</p>
        </div>
      </footer>
    </main>
  )
}
