"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Snowflakes from "@/components/snowflakes"
import { nomineeApi, votingApi, api } from "@/lib/api"
import { convertGoogleDriveUrl } from "@/lib/imageUtils"

interface VotingResults {
  [key: string]: {
    [key: string]: number
  }
}

export default function NominationPage() {
  const router = useRouter()
  const params = useParams()
  const nominationId = params?.id as string

  const [results, setResults] = useState<VotingResults>({})
  const [userVote, setUserVote] = useState<string | null>(null)
  const [selectedNominee, setSelectedNominee] = useState<string | null>(null)
  const [isRevoting, setIsRevoting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [nominees, setNominees] = useState<any[]>([]);
  const [category, setCategory] = useState<any|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [votingLoading, setVotingLoading] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("id")
    if (!userId) {
      router.push("/")
      return
    }
    setIsLoggedIn(true)
  }, [router])

useEffect(() => {
  setLoading(true);
  setError(null);
  nomineeApi.getByCategory(Number(nominationId))
    .then(async (response) => {
      setNominees(response.data);
      if (response.data.length > 0) {
        setCategory(response.data[0].category);
      }
      
      // Fetch user's vote from server after nominees are loaded
      const userId = localStorage.getItem("id")
      if (userId) {
        try {
          const voteResponse = await votingApi.getVote(Number(nominationId), Number(userId))
          const voteId = voteResponse.data
          if (voteId) {
            // Find which nominee this vote belongs to
            const vote = response.data.find((item: any) => item.id === voteId)
            if (vote) {
              setUserVote(String(vote.nominee.id))
              const votedKey = `voted_${nominationId}`
              localStorage.setItem(votedKey, String(vote.nominee.id))
            }
          }
        } catch (err) {
          // If no vote found, that's okay
          console.log("No vote found for user")
        }
      }
    })
    .catch((err) => {
      setError("Ошибка загрузки номинации");
    })
    .finally(() => setLoading(false));
}, [nominationId]);

  useEffect(() => {
    const stored = localStorage.getItem("votingResults")
    if (stored) {
      setResults(JSON.parse(stored))
    }
  }, [])

  if (!isLoggedIn) {
    return null
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center"><p className="text-lg text-muted-foreground">Загрузка номинации...</p></div>
      </main>
    );
  }
  if (error || !category) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Номинация не найдена</h1>
          <Link href="/">
            <Button>На главную</Button>
          </Link>
        </div>
      </main>
    );
  }

  const handleSelectNominee = (nomineeId: number) => {
    if (!userVote || isRevoting) {
      setSelectedNominee(String(nomineeId))
    }
  }

  const handleConfirmVote = async () => {
    if (!selectedNominee) return

    const userId = localStorage.getItem("id")
    if (!userId) {
      setError("Необходимо войти в систему для голосования")
      return
    }

    // Находим выбранное голосование (voting) для выбранного номинанта
    const selectedNomineeObj = nominees.find((item: any) => String(item.nominee.id) === selectedNominee)
    if (!selectedNomineeObj || !selectedNomineeObj.id) {
      setError("Не удалось найти голосование для выбранного номинанта")
      return
    }

    const voteId = selectedNomineeObj.id

    setVotingLoading(true)
    setError(null)

    try {
      // Если это переголосование, сначала отменяем предыдущий голос
      if (userVote && isRevoting) {
        try {
          await votingApi.unmakeVote(Number(nominationId), Number(userId))
        } catch (err: any) {
          console.error("Ошибка при отмене предыдущего голоса:", err)
          // Продолжаем выполнение, даже если отмена не удалась
        }
      }

      // Голосуем за выбранного номинанта
      await votingApi.makeVote(voteId, Number(userId))

      // Обновляем локальное состояние
      const newResults = JSON.parse(JSON.stringify(results))
      if (!newResults[nominationId]) {
        newResults[nominationId] = {}
      }
      if (userVote && isRevoting) {
        newResults[nominationId][userVote] = Math.max(0, (newResults[nominationId][userVote] || 0) - 1)
      }
      newResults[nominationId][selectedNominee] = (newResults[nominationId][selectedNominee] || 0) + 1

      setResults(newResults)
      localStorage.setItem("votingResults", JSON.stringify(newResults))

      const votedKey = `voted_${nominationId}`
      localStorage.setItem(votedKey, selectedNominee)
      setUserVote(selectedNominee)
      setSelectedNominee(null)
      setIsRevoting(false)
    } catch (err: any) {
      const message = err.response?.data || err.message || "Не удалось проголосовать"
      setError(message)
    } finally {
      setVotingLoading(false)
    }
  }

  const getTotalVotes = () => {
    return Object.values(results[nominationId] || {}).reduce((a, b) => a + b, 0)
  }

  const getVotesForNominee = (nomineeId: number) => {
    return results[nominationId]?.[String(nomineeId)] || 0
  }

  const getPercentage = (nomineeId: number) => {
    const total = getTotalVotes()
    if (total === 0) return 0
    return Math.round((getVotesForNominee(nomineeId) / total) * 100)
  }

  return (
    <main className="min-h-screen bg-background">
      <Snowflakes />

      <div className="relative overflow-hidden border-b border-accent/30 festive-header">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="outline" className="mb-6 border-border bg-transparent hover:bg-primary/10">
              ← К номинациям
            </Button>
          </Link>
          {category.photoUrl ? (
            <div className="mb-6 w-full h-64 rounded-lg overflow-hidden border border-border">
              <img 
                src={category.photoUrl} 
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-4 text-4xl">🏆</div>
          )}
          <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-balance text-lg text-muted-foreground">{category.description}</p>
          )}
        </div>
      </div>

      {/* Voting Info */}
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-8 p-4 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="mt-2"
            >
              Закрыть
            </Button>
          </div>
        )}
        {userVote && !isRevoting ? (
          <div className="mb-8 p-4 bg-accent/20 border border-accent/50 rounded-lg flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">✓ Ваш голос засчитан за эту номинацию</p>
            <Button
              onClick={() => setIsRevoting(true)}
              variant="outline"
              size="sm"
              className="border-accent text-accent hover:bg-accent/10"
            >
              Изменить выбор
            </Button>
          </div>
        ) : isRevoting ? (
          <div className="mb-8 p-4 bg-primary/20 border border-primary/50 rounded-lg">
            <p className="text-sm text-foreground">Выберите другого номинанта и подтвердите выбор</p>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-primary/20 border border-primary/50 rounded-lg">
            <p className="text-sm text-foreground">
              {selectedNominee
                ? "Нажмите «Подтвердить голос», чтобы выбрать"
                : "Выберите номинанта снизу и подтвердите голос"}
            </p>
          </div>
        )}
      </div>

      {/* Nominees */}
      <div className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {nominees.map((item: any) => {
            const nominee = item.nominee;
            const votes = getVotesForNominee(nominee.id)
            const percentage = getPercentage(nominee.id)
            const isSelected = selectedNominee === String(nominee.id)
            const isVotedFor = userVote === String(nominee.id)

            return (
              <div
                key={nominee.id}
                onClick={() => handleSelectNominee(nominee.id)}
                className={`relative cursor-pointer group transition-all duration-300 rounded-lg overflow-hidden ${
                  isVotedFor && !isRevoting
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : isSelected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : !userVote || isRevoting
                        ? "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background"
                        : ""
                }`}
              >
                <div className="aspect-square w-full overflow-hidden bg-card border border-border">
                  <iframe 
                    src={convertGoogleDriveUrl(nominee.photoUrl)} 
                    width="100%" 
                    height="100%"
                    className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                    style={{ border: "none" }}
                  />
                </div>

                {/* Overlay with voting info */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex flex-col justify-end p-3">
                  <h3 className="font-semibold text-foreground text-sm line-clamp-2">{nominee.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {votes} {votes === 1 ? "vote" : "votes"}
                    </span>
                    {isVotedFor && !isRevoting && <span className="text-xs font-semibold text-accent">✓ Voted</span>}
                    {isSelected && <span className="text-xs font-semibold text-primary">Selected</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

       
        {selectedNominee && (!userVote || isRevoting) && (
          <div className="mt-8 flex gap-3 justify-center">
            <Button
              onClick={async () => {
                const userId = localStorage.getItem("id")
                if (userId && userVote && isRevoting) {
                  // Если отменяем при переголосовании, отправляем запрос на сервер
                  setVotingLoading(true)
                  try {
                    await votingApi.unmakeVote(Number(nominationId), Number(userId))
                    // Обновляем локальное состояние
                    const newResults = JSON.parse(JSON.stringify(results))
                    if (newResults[nominationId] && newResults[nominationId][userVote]) {
                      newResults[nominationId][userVote] = Math.max(0, newResults[nominationId][userVote] - 1)
                      setResults(newResults)
                      localStorage.setItem("votingResults", JSON.stringify(newResults))
                    }
                    const votedKey = `voted_${nominationId}`
                    localStorage.removeItem(votedKey)
                    setUserVote(null)
                  } catch (err: any) {
                    console.error("Ошибка при отмене голоса:", err)
                    setError(err.response?.data || err.message || "Не удалось отменить голос")
                  } finally {
                    setVotingLoading(false)
                  }
                }
                setSelectedNominee(null)
                setIsRevoting(false)
              }}
              variant="outline"
              className="border-border"
              disabled={votingLoading}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleConfirmVote} 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={votingLoading}
            >
              {votingLoading ? "Обработка..." : "Подтвердить голос"}
            </Button>
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-card/40 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Ваш голос сохранён и будет учтен в финальных результатах.
          </p>
        </div>
      </footer>
    </main>
  )
}
