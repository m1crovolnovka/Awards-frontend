"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Snowflakes from "@/components/snowflakes"
import { votingApi, categoryApi } from "@/lib/api"

interface Category {
  id: number
  name: string
  description?: string
  photoUrl?: string
}

interface Nominee {
  id: number
  name: string
  photoUrl?: string
}

interface StatisticDTO {
  id: number
  category: Category
  nominee: Nominee
  count: number
}

export default function StatisticsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [statistics, setStatistics] = useState<StatisticDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
    fetchStatistics()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll()
      setCategories(response.data)
    } catch (err) {
      console.error("Ошибка загрузки категорий:", err)
    }
  }

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const response = await votingApi.getStatistics()
      setStatistics(response.data)
    } catch (err: any) {
      console.error("Ошибка загрузки статистики:", err)
      setError("Не удалось загрузить статистику")
    } finally {
      setLoading(false)
    }
  }

  const getTotalVotesForCategory = (categoryId: number) => {
    return statistics
      .filter((s) => s.category.id === categoryId)
      .reduce((sum, stat) => sum + stat.count, 0)
  }

  const getStatisticsForCategory = (categoryId: number) => {
    return statistics.filter((s) => s.category.id === categoryId)
  }

  return (
    <main className="min-h-screen bg-background">
      <Snowflakes />

      <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 flex gap-2 flex-wrap">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm text-xs sm:text-sm">
            Главная
          </Button>
        </Link>
        <Link href="/admin">
          <Button variant="outline" size="sm" className="bg-card/80 backdrop-blur-sm text-xs sm:text-sm">
            Админ-панель
          </Button>
        </Link>
      </div>

      <div className="relative overflow-hidden border-b border-accent/30 festive-header">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-balance text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground lg:text-5xl mb-2">
              Статистика
            </h1>
            <p className="text-balance text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Детальная статистика голосования
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 md:py-16 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2">
              Закрыть
            </Button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Загрузка статистики...</p>
          </div>
        ) : (
              <div className="space-y-6">
                {categories.map((category) => {
                  const categoryStats = getStatisticsForCategory(category.id)
                  const totalVotes = getTotalVotesForCategory(category.id)

                  // Группируем статистику по номинантам и суммируем голоса
                  const nomineeStatsMap = new Map<number, { nominee: Nominee; count: number }>()
                  
                  categoryStats.forEach((stat) => {
                    const existing = nomineeStatsMap.get(stat.nominee.id)
                    if (existing) {
                      existing.count += stat.count
                    } else {
                      nomineeStatsMap.set(stat.nominee.id, {
                        nominee: stat.nominee,
                        count: stat.count
                      })
                    }
                  })

                  const nomineeStats = Array.from(nomineeStatsMap.values())
                    .sort((a, b) => b.count - a.count)

                  return (
                    <Card key={category.id} className="border border-border bg-card/60 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle>{category.name}</CardTitle>
                        {category.description && <CardDescription>{category.description}</CardDescription>}
                        <p className="text-sm text-muted-foreground mt-2">Всего голосов: {totalVotes}</p>
                      </CardHeader>
                      <CardContent>
                        {nomineeStats.length > 0 ? (
                          <div className="space-y-4">
                            {nomineeStats.map((stat) => {
                              const percentage = totalVotes > 0 ? Math.round((stat.count / totalVotes) * 100) : 0
                              return (
                                <div key={stat.nominee.id} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{stat.nominee.name}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm text-muted-foreground">
                                        {stat.count} {stat.count === 1 ? "голос" : stat.count < 5 ? "голоса" : "голосов"}
                                      </span>
                                      <span className="text-sm font-semibold text-accent w-12 text-right">{percentage}%</span>
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-secondary/20 rounded-full h-3 overflow-hidden">
                                    <div
                                      className="bg-accent h-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">Голосов по этой категории пока нет</p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
                {categories.length === 0 && (
                  <Card className="border border-border bg-card/60 backdrop-blur-sm">
                    <CardContent className="py-12">
                      <p className="text-muted-foreground text-center">Категории не найдены</p>
                    </CardContent>
                  </Card>
                )}
              </div>
        )}
      </div>
    </main>
  )
}

