// src/pages/PlatesPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { getPlates } from '../services/api'

type PlateRow = { id: string; depto: string; patente: string }

const columns: GridColDef[] = [
  { field: 'depto', headerName: 'Departamento', flex: 1 },
  { field: 'patente', headerName: 'Patente', flex: 2 },
  {
    field: 'acciones',
    headerName: '',
    width: 80,
    sortable: false,
    renderCell: (p: GridRenderCellParams) => (
      <IconButton size="small" onClick={() => alert(`Editar ${p.row.id}`)}>
        <EditIcon fontSize="small" />
      </IconButton>
    ),
  },
]

export default function PlatesPage() {
  const [rows, setRows] = useState<PlateRow[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    const fetchData = async () => {
      try {
        setLoading(true)
        const { data } = await getPlates(q || undefined)
        if (!ignore) setRows(data)
      } catch (e) {
        console.error(e)
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchData()
    return () => { ignore = true }
  }, [q])

  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold">Administración de patentes</Typography>

      <Paper className="p-3 flex justify-end">
        <TextField
          size="small"
          placeholder="Buscar departamento o patente..."
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
          getRowId={(r) => r.id} // aseguramos la key
        />
      </Paper>
    </Box>
  )
}
