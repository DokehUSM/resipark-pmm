import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import { StyledEngineProvider } from '@mui/material/styles'
import App from './App'
import './index.css'

const theme = createTheme({
  palette: {
    primary: { main: '#4B5BD8' },
    secondary: { main: '#EF4444' },
  },
  shape: { borderRadius: 10 },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>
)
