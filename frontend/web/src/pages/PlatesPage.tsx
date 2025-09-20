import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { mockPlates } from '../mock'

const columns: GridColDef[] = [
  { field: 'depto', headerName: 'Departamento', flex: 1 },
  { field: 'patente', headerName: 'Patentes', flex: 2 },
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
  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold">Administración de patentes</Typography>
      <Paper className="p-3 flex justify-end">
        <TextField size="small" placeholder="Buscar departamento o patente..." />
      </Paper>
      <Paper className="h-[520px]"><DataGrid rows={mockPlates} columns={columns} disableRowSelectionOnClick /></Paper>
    </Box>
  )
}
