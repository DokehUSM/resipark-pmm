import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const cleanRutInput = (value: string) =>
  value
    .replace(/\./g, '')
    .replace(/-/g, '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase()
    .slice(0, 9)

export default function LoginPage() {
  const navigate = useNavigate()
  const { session, loading, login } = useAuth()

  const [rut, setRut] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) {
      navigate('/home', { replace: true })
    }
  }, [loading, session, navigate])

  const isDisabled = useMemo(
    () => !rut.trim() || !password.trim() || submitting,
    [rut, password, submitting]
  )

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (isDisabled) return

    setSubmitting(true)
    setError(null)

    try {
      await login(rut, password)
      navigate('/home', { replace: true })
    } catch (err: any) {
      setError(err.message ?? 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box className="min-h-screen grid grid-cols-1 md:grid-cols-[440px_1fr] bg-gray-50">
      <Box className="flex items-center justify-center px-8 py-14">
        <Card className="w-full max-w-lg shadow-xl" sx={{ borderRadius: 4 }}>
          <CardContent sx={{ px: { xs: 4, md: 6 }, py: { xs: 6, md: 8 } }}>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }} onSubmit={handleSubmit}>
              <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                <Typography variant="h4" className="font-semibold">
                  Resipark
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Control de acceso para conserjería
                </Typography>
              </Box>

              <TextField
                label="Rut Conserje"
                value={rut}
                onChange={(e) => setRut(cleanRutInput(e.target.value))}
                fullWidth
                size="medium"
                inputProps={{ inputMode: 'text', pattern: '[0-9Kk]*' }}
                helperText="Ingresa el RUT sin puntos ni guion"
              />

              <TextField
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                size="medium"
              />

              {error ? (
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
              ) : null}

              <Button type="submit" variant="contained" fullWidth disabled={isDisabled} size="large">
                {submitting ? 'Ingresando...' : 'Ingresar'}
              </Button>

              <Button variant="text" size="small" disabled sx={{ alignSelf: 'center' }}>
                ¿Olvidaste tu contraseña?
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      <Box
        className="hidden md:flex items-center justify-center bg-indigo-50"
        sx={{ position: 'relative', overflow: 'hidden' }}
      >
        <Box
          component="img"
          src="/icon.png"
          alt="Resipark"
          sx={{
            width: { md: 280, lg: 340 },
            height: 'auto',
            filter: 'drop-shadow(0 16px 32px rgba(79,70,229,0.25))',
          }}
        />
      </Box>
    </Box>
  )
}
