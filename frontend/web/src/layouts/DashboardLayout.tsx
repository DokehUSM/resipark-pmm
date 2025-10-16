import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, Box, Button } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import HistoryIcon from '@mui/icons-material/History'
import BadgeIcon from '@mui/icons-material/Badge'
import { useAuth } from '../context/AuthContext'

const drawerWidth = 220

const items = [
  { to: '/home', label: 'Inicio', icon: <HomeIcon /> },
  { to: '/history', label: 'Historial', icon: <HistoryIcon /> },
  { to: '/plates', label: 'Patentes', icon: <BadgeIcon /> },
]

export default function DashboardLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <Box className="min-h-screen bg-gray-50">
      <AppBar position="fixed" sx={{ zIndex: 1300 }}>
        <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant="h6" className="font-semibold">Resipark</Typography>
          {session ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" className="text-white/80">
                {session.nombre} · {session.rut}
              </Typography>
              <Button color="inherit" size="small" onClick={handleLogout}>
                Cerrar sesión
              </Button>
            </Box>
          ) : null}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth },
        }}
      >
        <Toolbar />
        <List>
          {items.map(i => (
            <ListItemButton key={i.to} component={Link} to={i.to} selected={pathname.startsWith(i.to)}>
              <ListItemIcon>{i.icon}</ListItemIcon>
              <ListItemText primary={i.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          ml: `${drawerWidth}px`,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Box className="p-6 flex-1 overflow-hidden"><Outlet /></Box>
      </Box>
    </Box>
  )
}
