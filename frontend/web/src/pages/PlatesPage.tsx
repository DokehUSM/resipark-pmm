// src/pages/PlatesPage.tsx
import { useEffect, useState } from 'react'
import { DataGrid, type GridColDef } from '@mui/x-data-grid'
import {
  Box, IconButton, Paper, TextField, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  MenuItem, Select, InputLabel, FormControl
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { getPlates, updatePlate, type PlateAPI } from '../services/api'

// Solo autos por ahora
const TIPO_OPCIONES: { value: number; label: string }[] = [
  { value: 1, label: 'Auto' },
]

type PlateRow = PlateAPI

export default function PlatesPage() {
  const [rows, setRows] = useState<PlateRow[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  // edición
  const [open, setOpen] = useState(false)
  const [editPatenteOriginal, setEditPatenteOriginal] = useState<string | null>(null)
  const [editPatente, setEditPatente] = useState('')
  const [editTipo, setEditTipo] = useState<number>(1) // default Auto

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data } = await getPlates(q || undefined)
      setRows(data as PlateRow[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [q]) // eslint-disable-line

  const handleOpenEdit = (row: PlateRow) => {
    setEditPatenteOriginal(row.patente)
    setEditPatente(row.patente)
    setEditTipo(row.tipo_vehiculo ?? 1)
    setOpen(true)
  }

  const handleSave = async () => {
    if (!editPatenteOriginal) return
    try {
      await updatePlate(editPatenteOriginal, {
        patente: editPatente !== editPatenteOriginal ? editPatente : undefined,
        tipo_vehiculo: editTipo,
      })
      setOpen(false)
      await fetchData()
    } catch (e: any) {
      console.error(e)
      alert(e?.response?.data?.detail ?? 'No se pudo actualizar')
    }
  }

  // --- columnas con el MISMO ancho (flex:1 en todas) ---
  const columns: GridColDef[] = [
    { field: 'depto', headerName: 'Departamento', flex: 1 },
    { field: 'patente', headerName: 'Patente', flex: 1 },
    {
      field: 'tipo_vehiculo',
      headerName: 'Tipo',
      flex: 1,
      valueFormatter: (value: any) => {
        const found = TIPO_OPCIONES.find(o => o.value === Number(value))
        return found?.label ?? String(value ?? '')
      },
    },
    {
      field: 'acciones',
      headerName: '',
      flex: 1,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (p) => (
        <IconButton size="small" onClick={() => handleOpenEdit(p.row as PlateRow)}>
          <EditIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Box className="space-y-4">
      <Typography variant="h6" className="font-semibold">Administración de patentes</Typography>

      {/* Barra de búsqueda centrada y ancha (igual estilo que en Historial) */}
      <Paper className="p-3 flex justify-center">
        <Box sx={{ width: 'min(560px, 100%)' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar departamento o patente..."
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
        />
      </Paper>

      {/* Diálogo edición */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Editar vehículo</DialogTitle>
        <DialogContent className="space-y-4">
          <TextField
            label="Patente"
            fullWidth
            value={editPatente}
            onChange={(e) => setEditPatente(e.target.value.toUpperCase())}
            helperText="Cambiar la patente puede fallar si tiene eventos históricos referenciados"
          />
          <FormControl fullWidth>
            <InputLabel id="tipo-label">Tipo de vehículo</InputLabel>
            <Select
              labelId="tipo-label"
              label="Tipo de vehículo"
              value={editTipo}
              onChange={(e) => setEditTipo(Number(e.target.value))}
            >
              {TIPO_OPCIONES.map(o => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
