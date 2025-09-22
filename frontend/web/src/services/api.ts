// src/services/api.ts
import axios from 'axios'
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

export const getPlates = (q?: string) =>
  api.get('/placas', { params: { q } })

export const getHistory = (q?: string) =>
  api.get('/historial', { params: { q } })



// Ejemplos para cuando tengas los endpoints en FastAPI:
// export const login = (rut: string, password: string) => api.post('/auth/login', { rut, password })
// export const getSpots = () => api.get('/parking/spots')
// export const getHistory = (q?: string) => api.get('/parking/history', { params: { q } })
// export const getPlates = (q?: string) => api.get('/plates', { params: { q } })


