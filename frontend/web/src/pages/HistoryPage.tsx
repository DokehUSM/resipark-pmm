import { useEffect, useState } from 'react'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Box, Paper, TextField, Typography } from '@mui/material'
import { getHistory } from '../services/api'

type HistoryRow = {
  id: string | number
  patente: string
  tipoUsuario: 'Residente' | 'Visita' | 'Desconocido'
  entrada: string | null // ISO string o null
  salida: string | null  // ISO string o null
  depto: string | null
  metodo: string | null
  evento: string | null
  hora: string // ISO de la fila (crudo)
}

const columns: GridColDef[] = [
  { field: 'patente', headerName: 'Patente', flex: 1 },
  { field: 'tipoUsuario', headerName: 'Tipo Usuario', width: 140 },
  { field: 'depto', headerName: 'Depto', width: 120 },
  {
    field: 'entrada',
    headerName: 'Entrada',
    width: 180,
    // 👇 OJO: no importamos tipos, usamos any para compatibilidad
    valueFormatter: (value: unknown) =>
      value ? new Date(String(value)).toLocaleString() : '-',
  },
  {
    field: 'salida',
    headerName: 'Salida',
    width: 180,
    valueFormatter: (value: unknown) =>
      value ? new Date(String(value)).toLocaleString() : '-',
  },
  { field: 'metodo', headerName: 'Método', width: 140 },
  { field: 'evento', headerName: 'Evento', width: 140 },
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
    fetchData()
    return () => { ignore = true }
  }, [q])

  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold">Historial</Typography>

      <Paper className="p-3 flex justify-end gap-2">
        <TextField
          size="small"
          placeholder="Buscar por patente o depto..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </Paper>

      <Paper className="h-[520px]">
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          getRowId={(r) => r.id}
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
