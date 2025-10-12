// src/services/api.ts
import axios from 'axios'
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

export const getPlates = (q?: string) =>
  api.get('/placas', { params: { q } })

export type PlateAPI = { id: string; depto: string; patente: string; tipo_vehiculo: number }

export const updatePlate = (patenteActual: string, payload: {
  patente?: string
  tipo_vehiculo?: number
}) => api.put(`/placas/${encodeURIComponent(patenteActual)}`, payload)


export const getHistory = (q?: string) =>
  api.get('/historial', { params: { q } })

// --- Tipos básicos ---
export type SpotAPI = { id: string; estado: 0 | 1 | 2; estado_label: string }
export type PendingAPI = {
  id: number; depto: string; patente: string; rut: string;
  hora_inicio: string; hora_termino: string
}
export type AssignedAPI = PendingAPI & { est: string } // est = id_estacionamiento
export type DepartmentAPI = { id: string }

// --- Estado de estacionamientos ---
export const getSpotsState = () => api.get<SpotAPI[]>('/dashboard/estados')

// --- Reservas: crear / listar / acciones ---
export const createVisit = (payload: {
  patente: string
  rut: string
  depto: string
  hora_inicio: string // ISO
  hora_termino: string // ISO
  rut_conserje?: string
}) => api.post('/reservas', payload)

export const getPendings = () => api.get<PendingAPI[]>('/reservas/pendientes')
export const getAssigned = () => api.get<AssignedAPI[]>('/reservas/asignadas')

export const assignParking = (id_reserva: number, id_estacionamiento: string) =>
  api.post(`/reservas/${id_reserva}/asignar`, { id_estacionamiento })

export const unassignParking = (id_reserva: number) =>
  api.post(`/reservas/${id_reserva}/desasignar`)

export const cancelReservation = (id_reserva: number) =>
  api.delete(`/reservas/${id_reserva}`)

export const getDepartments = () => api.get<DepartmentAPI[]>('/departamentos')


// Ejemplos para cuando tengas los endpoints en FastAPI:
// export const login = (rut: string, password: string) => api.post('/auth/login', { rut, password })
// export const getSpots = () => api.get('/parking/spots')
// export const getHistory = (q?: string) => api.get('/parking/history', { params: { q } })
// export const getPlates = (q?: string) => api.get('/plates', { params: { q } })


