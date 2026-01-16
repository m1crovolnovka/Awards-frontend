import axios from "axios"

// Получаем URL бэкенда из переменной окружения, по умолчанию localhost:8080
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://awards-jx4m.onrender.com"

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const username = localStorage.getItem("username");
        const password = localStorage.getItem("password"); 
        if(username && password){
            config.auth = {
            username: username,
            password: password
            };
        }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
        localStorage.removeItem("id")
        localStorage.removeItem("username")
        localStorage.removeItem("role")
        localStorage.removeItem("password")
        window.location.href = "/"
      }
    }
    return Promise.reject(error)
  },
)

export const api = {
  getAuthToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("authToken")
    }
    return null
  },

  getUser: () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user) : null
    }
    return null
  },
}

// Category API
export const categoryApi = {
  getAll: () => axiosInstance.get("/api/categories"),
  getById: (id: number) => axiosInstance.get(`/api/categories/${id}`),
  getUserCategories: () => axiosInstance.get("/api/categories/user"),
  update: (id: number, name: string, description: string, photoUrl?: string) =>
    axiosInstance.put(`/api/categories/${id}`, { name, description, photoUrl }),
  delete: (id: number) => axiosInstance.delete(`/api/categories/${id}`),
}

// Nominee API
export const nomineeApi = {
  getAll: () => axiosInstance.get("/api/nominees"),
  getByCategory: (categoryId: number) => axiosInstance.get(`/api/voting/${categoryId}`),
  getById: (id: number) => axiosInstance.get(`/api/nominees/${id}`),
  update: (id: number, name: string, photoUrl: string) =>
    axiosInstance.put(`/api/nominees/${id}`, { name, photoUrl }),
  delete: (id: number) => axiosInstance.delete(`/api/nominees/${id}`),
}

// Voting API
export const votingApi = {
  makeVote: (voteId: number, userId: number) => 
    axiosInstance.post(`/api/voting/makeVote/${voteId}`, userId),
  unmakeVote: (categoryId: number, userId: number) => 
    axiosInstance.post(`/api/voting/unmakeVote/${categoryId}`, userId),
  getVote: (categoryId: number, userId: number) =>
    axiosInstance.get(`/api/voting/${categoryId}/${userId}`),
  getStatistics: () => axiosInstance.get("/api/voting/statistics"),
  getResults: () => axiosInstance.get("/api/voting/results"),
  createVote: (categoryId: number, nomineeIds: number[]) =>
    axiosInstance.post("/api/voting", { categoryId, nomineeIds }),
  getAll: (categoryId: number) => axiosInstance.get(`/api/voting/${categoryId}`),
  delete: (id: number) => axiosInstance.delete(`/api/voting/${id}`),
}

// User API
export const userApi = {
  getAll: () => axiosInstance.get("/api/users"),
  login: (username: string, password: string) => axiosInstance.post("/api/users/login", { username, password }),
  register: (email: string, password: string, name: string) =>
    axiosInstance.post("/api/users/register", { email, password, name }),
  delete: (id: number) => axiosInstance.delete(`/api/users/${id}`),
  getVotes: (userId: number) => axiosInstance.get(`/api/users/${userId}/votes`),
}

// Admin API
export const adminApi = {
  createCategory: (name: string, description: string, photoUrl?: string) => 
    axiosInstance.post("/api/categories", { name, description, photoUrl }),
  createNominee: (categoryId: number, name: string, photoUrl: string) =>
    axiosInstance.post("/api/nominees", { categoryId, name, photoUrl }),
  createUser: (username: string, password: string) =>
    axiosInstance.post("/api/users/register", { username, password }),
  getStatistics: () => axiosInstance.get("/api/admin/statistics"),
}
