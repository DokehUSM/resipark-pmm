import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { login as loginRequest, setAuthToken } from '../services/api'

type AuthSession = {
  rut: string
  nombre: string
  token: string
}

type AuthContextValue = {
  session: AuthSession | null
  loading: boolean
  login: (rut: string, password: string) => Promise<void>
  logout: () => void
}

const STORAGE_KEY = 'resipark-web-auth'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const sanitizeRut = (rut: string) =>
  rut.replace(/\./g, '').replace(/-/g, '').replace(/\s+/g, '').toUpperCase()

const persistSession = (session: AuthSession | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

const readStoredSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (parsed?.token && parsed?.rut) {
      return parsed
    }
  } catch (err) {
    console.warn('No se pudo leer la sesión almacenada', err)
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = readStoredSession()
    if (stored) {
      setSession(stored)
      setAuthToken(stored.token)
    }
    setLoading(false)
  }, [])

  const logout = useCallback(() => {
    setSession(null)
    setAuthToken(null)
    persistSession(null)
  }, [])

  const login = useCallback(
    async (rut: string, password: string) => {
      const cleanedRut = sanitizeRut(rut)
      if (!cleanedRut) {
        throw new Error('Ingresa un RUT válido')
      }

      try {
        const { data } = await loginRequest(cleanedRut, password)
        const nextSession: AuthSession = {
          rut: data.rut,
          nombre: data.nombre,
          token: data.access_token,
        }
        setSession(nextSession)
        setAuthToken(nextSession.token)
        persistSession(nextSession)
      } catch (error: any) {
        const message =
          error?.response?.data?.detail ??
          error?.message ??
          'No pudimos iniciar sesión, intenta nuevamente'
        throw new Error(message)
      }
    },
    []
  )

  const value = useMemo(
    () => ({ session, loading, login, logout }),
    [session, loading, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  return ctx
}
