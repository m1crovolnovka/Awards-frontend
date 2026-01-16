"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Snowflakes from "@/components/snowflakes"
import { userApi } from "@/lib/api"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setПароль] = useState("")
  const [confirmПароль, setConfirmПароль] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmПароль) {
      setError("Парольs don't match")
      return
    }

    if (password.length < 6) {
      setError("Пароль must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const response = await userApi.register(email, password, name)
      const data = response.data

      // Store auth token
      localStorage.setItem("authToken", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirect to home
      router.push("/")
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "An error occurred"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Snowflakes />

      <Card className="w-full max-w-md border border-border bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
          <CardDescription className="text-center">Зарегистрируйтесь, чтобы начать голосовать</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setПароль(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmПароль">Confirm Пароль</Label>
              <Input
                id="confirmПароль"
                type="password"
                placeholder="••••••••"
                value={confirmПароль}
                onChange={(e) => setConfirmПароль(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Создание аккаунта..." : "Зарегистрироваться"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Уже есть аккаунт? </span>
            <Link href="/" className="text-primary hover:underline">
              Войти
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← На главную
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
