import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import HistoryPage from './pages/HistoryPage'
import PlatesPage from './pages/PlatesPage'
import { useAuth } from './context/AuthContext'

function ProtectedLayout() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <DashboardLayout />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/plates" element={<PlatesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
