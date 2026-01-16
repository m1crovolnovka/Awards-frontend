"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import Image from "next/image"
import Snowflakes from "@/components/snowflakes"
import { adminApi, categoryApi, nomineeApi, votingApi, userApi } from "@/lib/api"
import { convertGoogleDriveUrl } from "@/lib/imageUtils"

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
  category?: Category
}

interface Voting {
  id: number
  category: Category
  nominee: Nominee
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [votings, setVotings] = useState<Voting[]>([])
  const [categoryVotings, setCategoryVotings] = useState<Voting[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Category form state
  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [categoryPhotoUrl, setCategoryPhotoUrl] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Nominee form state
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [nomineeName, setNomineeName] = useState("")
  const [nomineePhoto, setNomineePhoto] = useState("")
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null)

  // Vote creation state
  const [voteCategoryId, setVoteCategoryId] = useState("")
  const [selectedNomineeIds, setSelectedNomineeIds] = useState<number[]>([])

  // User creation state
  const [users, setUsers] = useState<any[]>([])
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState("USER")

  useEffect(() => {
    fetchCategories()
    fetchNominees()
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll()
      setUsers(response.data)
    } catch (err) {
      console.error("Ошибка загрузки пользователей:", err)
    }
  }

  useEffect(() => {
    // Сброс выбранных номинантов при смене категории
    setSelectedNomineeIds([])
    // Загрузка голосований для выбранной категории
    if (voteCategoryId) {
      fetchVotingsByCategory(Number(voteCategoryId))
    } else {
      setCategoryVotings([])
    }
  }, [voteCategoryId])

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll()
      setCategories(response.data)
    } catch (err) {
      console.error("Ошибка загрузки категорий:", err)
    }
  }

  const fetchNominees = async () => {
    try {
      const response = await nomineeApi.getAll()
      setNominees(response.data)
    } catch (err) {
      console.error("Ошибка загрузки номинантов:", err)
    }
  }

  const fetchVotings = async () => {
    try {
      const response = await votingApi.getAll(Number(voteCategoryId))
      setVotings(response.data)
    } catch (err) {
      console.error("Ошибка загрузки голосований:", err)
    }
  }
  const fetchVotingsByCategory = async (categoryId: number) => {
    try {
      const response = await votingApi.getAll(categoryId)
      setCategoryVotings(response.data)
    } catch (err) {
      console.error("Ошибка загрузки голосований:", err)
      setCategoryVotings([])
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, categoryName, categoryDescription, categoryPhotoUrl)
        setSuccess("Категория успешно обновлена!")
      } else {
        await adminApi.createCategory(categoryName, categoryDescription, categoryPhotoUrl)
        setSuccess("Категория успешно создана!")
      }
      setCategoryName("")
      setCategoryDescription("")
      setCategoryPhotoUrl("")
      setEditingCategory(null)
      fetchCategories()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Ошибка операции"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setCategoryDescription(category.description || "")
    setCategoryPhotoUrl(category.photoUrl || "")
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту категорию?")) return

    try {
      await categoryApi.delete(id)
      setSuccess("Категория успешно удалена!")
      fetchCategories()
      fetchNominees()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Не удалось удалить категорию"
      setError(message)
    }
  }

  const handleCreateNominee = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (editingNominee) {
        await nomineeApi.update(editingNominee.id, nomineeName, nomineePhoto)
        setSuccess("Номинант успешно обновлен!")
      } else {
        await adminApi.createNominee(Number(selectedCategoryId), nomineeName, nomineePhoto)
        setSuccess("Номинант успешно создан!")
      }
      setNomineeName("")
      setNomineePhoto("")
      setSelectedCategoryId("")
      setEditingNominee(null)
      fetchNominees()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Ошибка операции"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditNominee = (nominee: Nominee) => {
    setEditingNominee(nominee)
    setNomineeName(nominee.name)
    setNomineePhoto(nominee.photoUrl || "")
    setSelectedCategoryId(nominee.category?.id.toString() || "")
  }

  const handleDeleteNominee = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого номинанта?")) return

    try {
      await nomineeApi.delete(id)
      setSuccess("Номинант успешно удален!")
      fetchNominees()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Не удалось удалить номинанта"
      setError(message)
    }
  }

  const handleCreateVote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voteCategoryId || selectedNomineeIds.length === 0) {
      setError("Выберите категорию и хотя бы одного номинанта")
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await votingApi.createVote(Number(voteCategoryId), selectedNomineeIds)
      setSuccess("Голосование успешно создано!")
      setVoteCategoryId("")
      setSelectedNomineeIds([])
      if (voteCategoryId) {
        fetchVotingsByCategory(Number(voteCategoryId))
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Не удалось создать голосование"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVoting = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить это голосование?")) return

    try {
      await votingApi.delete(id)
      setSuccess("Голосование успешно удалено!")
      if (voteCategoryId) {
        fetchVotingsByCategory(Number(voteCategoryId))
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Не удалось удалить голосование"
      setError(message)
    }
  }

  const getNomineesByCategory = (categoryId: number) => {
    const votedNomineeIds = new Set(
      categoryVotings.map(voting => voting.nominee.id)
    );
    
    return nominees.filter(nominee => !votedNomineeIds.has(nominee.id));
  };

  const toggleNomineeSelection = (nomineeId: number) => {
    setSelectedNomineeIds((prev) =>
      prev.includes(nomineeId) ? prev.filter((id) => id !== nomineeId) : [...prev, nomineeId]
    )
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      await adminApi.createUser(newUsername, newPassword)
      setSuccess("Пользователь успешно создан!")
      setNewUsername("")
      setNewPassword("")
      setNewUserRole("USER")
      fetchUsers()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Ошибка создания пользователя"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return

    try {
      await userApi.delete(id)
      setSuccess("Пользователь успешно удален!")
      fetchUsers()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Не удалось удалить пользователя"
      setError(message)
    }
  }


  return (
    <main className="min-h-screen bg-background">
      <Snowflakes />

      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Link href="/">
          <Button variant="outline" className="bg-card/80 backdrop-blur-sm">
            Главная
          </Button>
        </Link>
        <Link href="/admin/statistics">
          <Button variant="outline" className="bg-card/80 backdrop-blur-sm">
            Статистика
          </Button>
        </Link>
      </div>

      <div className="relative overflow-hidden border-b border-accent/30 festive-header">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-2">
              Панель администратора
            </h1>
            <p className="text-balance text-lg text-muted-foreground max-w-2xl mx-auto">
              Управление категориями и номинантами для новогодних премий
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-md bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        <Tabs defaultValue="categories" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="categories">Категории</TabsTrigger>
            <TabsTrigger value="nominees">Номинанты</TabsTrigger>
            <TabsTrigger value="votes">Создание голосов</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card className="border border-border bg-card/60 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle>{editingCategory ? "Редактировать категорию" : "Создать категорию"}</CardTitle>
                <CardDescription>
                  {editingCategory ? "Измените данные категории" : "Добавить новую категорию награды"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryName">Название категории</Label>
                    <Input
                      id="categoryName"
                      type="text"
                      placeholder="например, Лучший студент"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryDescription">Описание</Label>
                    <Textarea
                      id="categoryDescription"
                      placeholder="Краткое описание этой категории"
                      value={categoryDescription}
                      onChange={(e) => setCategoryDescription(e.target.value)}
                      disabled={loading}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categoryPhotoUrl">URL фотографии</Label>
                    <Input
                      id="categoryPhotoUrl"
                      type="text"
                      placeholder="https://example.com/photo.jpg"
                      value={categoryPhotoUrl}
                      onChange={(e) => setCategoryPhotoUrl(e.target.value)}
                      disabled={loading}
                    />
                    {categoryPhotoUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border w-48 h-48 relative">
                        <img
                          src={categoryPhotoUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Сохранение..." : editingCategory ? "Сохранить изменения" : "Создать категорию"}
                    </Button>
                    {editingCategory && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingCategory(null)
                          setCategoryName("")
                          setCategoryDescription("")
                          setCategoryPhotoUrl("")
                        }}
                      >
                        Отмена
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Существующие категории</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="p-4 rounded-md border border-border bg-background/50 flex items-start justify-between gap-4">
                      {category.photoUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          <img src={category.photoUrl} alt={category.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-lg">{category.name}</p>
                        {category.description && <p className="text-sm text-muted-foreground mt-1">{category.description}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                          Изменить
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-muted-foreground text-center py-4">Категории не найдены</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nominees">
            <Card className="border border-border bg-card/60 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle>{editingNominee ? "Редактировать номинанта" : "Создать номинанта"}</CardTitle>
                <CardDescription>
                  {editingNominee ? "Измените данные номинанта" : "Добавить номинанта в категорию"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNominee} className="space-y-4">
                
                  <div className="space-y-2">
                    <Label htmlFor="nomineeName">Имя номинанта</Label>
                    <Input
                      id="nomineeName"
                      type="text"
                      placeholder="например, Иван Иванов"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomineePhoto">URL фотографии</Label>
                    <Input
                      id="nomineePhoto"
                      type="text"
                      placeholder="https://example.com/photo.jpg"
                      value={nomineePhoto}
                      onChange={(e) => setNomineePhoto(e.target.value)}
                      disabled={loading}
                      required
                    />
                    {nomineePhoto && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-border w-48 h-48 relative">
                        <iframe
                          src={convertGoogleDriveUrl(nomineePhoto)}
                          className="w-full h-full"
                          title="Preview"
                          style={{ border: "none" }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Сохранение..." : editingNominee ? "Сохранить изменения" : "Создать номинанта"}
                    </Button>
                    {editingNominee && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingNominee(null)
                          setNomineeName("")
                          setNomineePhoto("")
                          setSelectedCategoryId("")
                        }}
                      >
                        Отмена
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Существующие номинанты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {nominees.map((nominee) => (
                    <div key={nominee.id} className="p-4 rounded-md border border-border bg-background/50 flex items-center gap-4">
                      {nominee.photoUrl && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-border flex-shrink-0">
                          <iframe src={convertGoogleDriveUrl(nominee.photoUrl)} className="w-full h-full" title={nominee.name} style={{ border: "none" }} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-lg">{nominee.name}</p>
                        {nominee.category && <p className="text-sm text-muted-foreground">Категория: {nominee.category.name}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditNominee(nominee)}>
                          Изменить
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteNominee(nominee.id)}>
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {nominees.length === 0 && <p className="text-muted-foreground text-center py-4">Номинанты не найдены</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="votes">
            <Card className="border border-border bg-card/60 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle>Создать голосование</CardTitle>
                <CardDescription>Выберите категорию и номинантов для голосования</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateVote} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="voteCategory">Категория</Label>
                    <Select value={voteCategoryId} onValueChange={setVoteCategoryId} disabled={loading} required>
                      <SelectTrigger id="voteCategory">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {voteCategoryId && (
                    <div className="space-y-2">
                      <Label>Выберите номинантов</Label>
                      {selectedNomineeIds.length > 0 && (
                        <div className="mb-2 p-2 bg-accent/10 border border-accent/30 rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Выбрано номинантов: {selectedNomineeIds.length}</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedNomineeIds.map((id) => {
                              const nominee = nominees.find((n) => n.id === id)
                              return nominee ? (
                                <span key={id} className="text-xs px-2 py-1 bg-accent/20 rounded">
                                  {nominee.name}
                                </span>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-md p-4">
                        {getNomineesByCategory(Number(voteCategoryId)).length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">В этой категории нет номинантов</p>
                        ) : (
                          getNomineesByCategory(Number(voteCategoryId)).map((nominee) => (
                            <div key={nominee.id} className="flex items-center space-x-2 p-2 hover:bg-accent/10 rounded">
                              <Checkbox
                                id={`nominee-${nominee.id}`}
                                checked={selectedNomineeIds.includes(nominee.id)}
                                onCheckedChange={() => toggleNomineeSelection(nominee.id)}
                              />
                              <label
                                htmlFor={`nominee-${nominee.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2 flex-1"
                              >
                                {nominee.photoUrl && (
                                  <div className="w-10 h-10 rounded overflow-hidden border border-border">
                                    <iframe
                                      src={convertGoogleDriveUrl(nominee.photoUrl)}
                                      className="w-full h-full"
                                      title={nominee.name}
                                      style={{ border: "none" }}
                                    />
                                  </div>
                                )}
                                {nominee.name}
                                {selectedNomineeIds.includes(nominee.id) && (
                                  <span className="text-xs text-accent ml-auto">✓</span>
                                )}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={loading || !voteCategoryId || selectedNomineeIds.length === 0}>
                    {loading ? "Создание..." : "Создать голосование"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {voteCategoryId && (
            <Card className="border border-border bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Существующие голосования</CardTitle>
                <CardDescription>Управление созданными голосованиями</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryVotings.map((voting) => (
                    <div key={voting.id} className="p-4 rounded-md border border-border bg-background/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{voting.category?.name || "Без категории"}</p>
                          {voting.category?.description && (
                            <p className="text-sm text-muted-foreground mt-1">{voting.category.description}</p>
                          )}
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2">
                                <div key={voting.nominee.id} className="flex items-center gap-2 px-2 py-1 bg-accent/10 rounded text-sm">
                                   {voting.nominee.photoUrl && (
                                    <div className="w-6 h-6 rounded overflow-hidden border border-border">
                                      <iframe
                                        src={convertGoogleDriveUrl(voting.nominee.photoUrl)}
                                        className="w-full h-full"
                                        title={voting.nominee.name}
                                        style={{ border: "none" }}
                                      />
                                    </div>
                                  )} 
                                  <span>{voting.nominee.name}</span>
                                </div>
                              </div>
                          </div>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteVoting(voting.id)}
                          className="ml-4"
                        >
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {votings.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Голосования не найдены</p>
                  )}
                </div>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            <Card className="border border-border bg-card/60 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle>Создать пользователя</CardTitle>
                <CardDescription>Создать новую учетную запись пользователя</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newUsername">Имя пользователя</Label>
                    <Input
                      id="newUsername"
                      type="text"
                      placeholder="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Пароль</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Создание..." : "Создать пользователя"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Существующие пользователи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="p-4 rounded-md border border-border bg-background/50 flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{user.username}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          Удалить
                        </Button>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-muted-foreground text-center py-4">Пользователи не найдены</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
