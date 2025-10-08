import { useEffect, useState } from 'react'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Box, Paper, TextField, Typography } from '@mui/material'
import { getHistory } from '../services/api'

type HistoryRow = {
  id: string | number
  patente: string
  tipoUsuario: 'Residente' | 'Visita' | 'Desconocido'
  entrada: string | null
  salida: string | null
  depto: string | null
  // metodo: string | null   // ← eliminada
  evento: string | null
  hora: string
}

const REFRESH_MS = 10_000

// 24 h
const fmt24h = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-CL', { hour12: false }) : '-'

// 👇 columnas con renderCell (sin 'método')
const columns: GridColDef<any>[] = [
  { field: 'patente', headerName: 'Patente', flex: 1 },
  { field: 'tipoUsuario', headerName: 'Tipo Usuario', flex: 1 },
  { field: 'depto', headerName: 'Depto', flex: 1 },

  {
    field: 'entrada',
    headerName: 'Entrada',
    flex: 1,
    renderCell: (params: any) => {
      const r = params.row
      // si backend ya manda `entrada`, úsala; si no, cae al `hora` cuando evento=Ingreso
      const v = r?.entrada ?? (r?.evento?.toLowerCase()?.includes('ingres') ? r?.hora : null)
      return fmt24h(v)
    },
  },
  {
    field: 'salida',
    headerName: 'Salida',
    flex: 1,
    renderCell: (params: any) => {
      const r = params.row
      // si backend ya manda `salida`, úsala; si no, cae al `hora` cuando evento=Salida
      const v = r?.salida ?? (r?.evento?.toLowerCase()?.includes('salid') ? r?.hora : null)
      return fmt24h(v)
    },
  },

  { field: 'evento', headerName: 'Evento', flex: 1 },
]



export default function HistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    const fetchData = async () => {
      try {
        setLoading(true)
        setErrorMsg(null)
        const { data } = await getHistory(q || undefined)
        if (!ignore) setRows(data as HistoryRow[])
      } catch (e) {
        console.error(e)
        if (!ignore) setErrorMsg('No se pudo cargar el historial')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    // carga inicial + polling
    fetchData()
    const timer = setInterval(fetchData, REFRESH_MS)

    return () => { ignore = true; clearInterval(timer) }
  }, [q])

  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold">Historial</Typography>

      {/* barra de búsqueda centrada y ancha */}
      <Paper className="p-3 flex justify-center">
        <Box sx={{ width: 'min(560px, 100%)' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por patente o depto..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </Box>
      </Paper>

      <Paper className="h-[520px]">
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          getRowId={(r) => r.id}
          pageSizeOptions={[5, 25, 50, 100]}
          slots={{
            noRowsOverlay: () => (
              <Box className="h-full w-full flex items-center justify-center text-gray-500">
                {errorMsg || 'Sin registros'}
              </Box>
            ),
          }}
        />
      </Paper>
    </Box>
  )
}
