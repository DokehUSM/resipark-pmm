import { Box, Button, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

import { mockSpots } from '../mock';
import ParkingSpotCard from '../components/ParkingSpotCard';

export default function HomePage() {
  return (
    <Box className="space-y-6">
      <Typography variant="h6" className="font-semibold">Inicio</Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper className="h-52 grid place-items-center text-gray-500">
                Entrada (video)
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper className="h-52 grid place-items-center text-gray-500">
                Salida (video)
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Typography className="mb-2 font-medium">Disponibilidad</Typography>
          <Grid container spacing={1}>
            {mockSpots.map((s) => (
              <Grid key={s.id} size={4} className="pb-2">
                <ParkingSpotCard spot={s} />
              </Grid>
            ))}
          </Grid>

          <Paper className="mt-4 p-4 flex flex-col items-center">
            <Typography variant="h6" className="mb-2">Resipark</Typography>
            <Button variant="contained" color="secondary" fullWidth>
              Liberar
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
