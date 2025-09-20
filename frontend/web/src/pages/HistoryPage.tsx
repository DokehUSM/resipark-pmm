import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import { Box, Paper, TextField, Typography } from '@mui/material'
import { mockHistory } from '../mock'

const columns: GridColDef[] = [
  { field: 'patente', headerName: 'Patente', flex: 1 },
  { field: 'tipo', headerName: 'Tipo Usuario', flex: 1 },
  { field: 'entrada', headerName: 'Entrada', width: 120 },
  { field: 'salida', headerName: 'Salida', width: 120 },
]

export default function HistoryPage() {
  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold">Historial</Typography>
      <Paper className="p-3 flex justify-end"><TextField size="small" placeholder="Buscar..." /></Paper>
      <Paper className="h-[520px]">
        <DataGrid rows={mockHistory} columns={columns} disableRowSelectionOnClick />
      </Paper>
    </Box>
  )
}
