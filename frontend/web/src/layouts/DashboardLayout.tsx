import { Link, Outlet, useLocation } from 'react-router-dom'
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, AppBar, Typography, Box } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import HistoryIcon from '@mui/icons-material/History'
import BadgeIcon from '@mui/icons-material/Badge'

const drawerWidth = 220

const items = [
  { to: '/home', label: 'Inicio', icon: <HomeIcon /> },
  { to: '/history', label: 'Historial', icon: <HistoryIcon /> },
  { to: '/plates', label: 'Patentes', icon: <BadgeIcon /> },
]

export default function DashboardLayout() {
  const { pathname } = useLocation()

  return (
    <Box className="min-h-screen bg-gray-50">
      <AppBar position="fixed" sx={{ zIndex: 1300 }}>
        <Toolbar><Typography variant="h6" className="font-semibold">Resipark</Typography></Toolbar>
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
