import { useMemo, useState } from 'react';
import { Box, Button, Chip, Divider, Paper, Typography } from '@mui/material';

import { mockSpots } from '../mock';
import ParkingSpotCard from '../components/ParkingSpotCard';
import type { ParkingSpot } from '../types';

const statusLabels: Record<ParkingSpot['status'], string> = {
  available: 'Disponible',
  occupied: 'Ocupado',
  reserved: 'Reservado',
};

export default function HomePage() {
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(
    mockSpots[0]?.id ?? null
  );
  const selectedSpot = useMemo(
    () => mockSpots.find((spot) => spot.id === selectedSpotId) ?? null,
    [selectedSpotId]
  );

  return (
    <Box sx={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden', gap: 2, p: 2 }}>
      {/* Columna izquierda - 55% */}
      <Box
        sx={{
          flexBasis: '55%',
          maxWidth: '55%',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Paper className="flex flex-1 flex-col overflow-hidden">
          <Box className="flex items-center justify-between border-b border-gray-200 p-4">
            <Typography variant="subtitle1" className="font-semibold">
              Camara de entrada
            </Typography>
            <Chip label="En vivo" color="primary" size="small" />
          </Box>
          <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
            <Typography>Stream camara de entrada</Typography>
          </Box>
        </Paper>

        <Paper className="flex flex-1 flex-col overflow-hidden">
          <Box className="flex items-center justify-between border-b border-gray-200 p-4">
            <Typography variant="subtitle1" className="font-semibold">
              Camara de salida
            </Typography>
            <Chip label="En vivo" color="primary" size="small" />
          </Box>
          <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
            <Typography>Stream camara de salida</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Columna derecha - 45% con scroll interno */}
      <Box
        sx={{
          flexBasis: '45%',
          maxWidth: '45%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Paper sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', p: 2 }}>
          <Box className="flex items-center justify-between pb-4">
            <Typography variant="h6" className="font-semibold">
              Estado de estacionamientos
            </Typography>
            <Chip label={`${mockSpots.length} totales`} size="small" />
          </Box>

          {/* Scroll interno */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 1 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
              {mockSpots.map((spot) => (
                <ParkingSpotCard
                  key={spot.id}
                  spot={spot}
                  onSelect={() => setSelectedSpotId(spot.id)}
                  selected={spot.id === selectedSpotId}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {selectedSpot ? (
            <Box className="space-y-3">
              <Typography variant="subtitle1" className="font-semibold">
                Detalle
              </Typography>
              <Box className="flex items-center gap-2">
                <Typography variant="h5" className="font-semibold">
                  {selectedSpot.code}
                </Typography>
                <Chip
                  label={statusLabels[selectedSpot.status]}
                  color={
                    selectedSpot.status === 'available'
                      ? 'success'
                      : selectedSpot.status === 'reserved'
                      ? 'warning'
                      : 'error'
                  }
                  size="small"
                />
              </Box>
              <Typography className="text-sm text-gray-600">
                Ultima actualizacion: {selectedSpot.since ?? '-'}
              </Typography>
              <Box className="flex gap-2">
                <Button variant="contained" color="secondary" fullWidth>
                  Liberar
                </Button>
                <Button variant="outlined" fullWidth>
                  Ver historial
                </Button>
              </Box>
            </Box>
          ) : (
            <Box className="text-sm text-gray-500">
              Selecciona un estacionamiento para ver más información.
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
