import { Box, Button, Card, CardContent, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const nav = useNavigate()
  return (
    <Box className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <Box className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="space-y-4">
            <Typography variant="h5" className="font-semibold">Resipark</Typography>
            <TextField label="Rut Conserje" fullWidth />
            <TextField label="Contraseña" type="password" fullWidth />
            <Button variant="contained" fullWidth onClick={() => nav('/home')}>Ingresar</Button>
            <Button variant="text" size="small">¿Olvidaste tu contraseña?</Button>
          </CardContent>
        </Card>
      </Box>
      <Box className="hidden md:flex items-center justify-center bg-gray-100">
        <Box className="w-72 h-56 bg-gray-300 rounded-lg" />
      </Box>
    </Box>
  )
}
