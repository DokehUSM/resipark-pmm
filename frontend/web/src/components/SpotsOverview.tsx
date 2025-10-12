import { Box, Chip, Typography, Paper } from "@mui/material";
import type { ParkingSpot } from "../types";
import ParkingSpotCard from "./ParkingSpotCard";

type Props = {
  spots: ParkingSpot[];
  onSelect: (spot: ParkingSpot) => void;
  selectedSpotId: string | null;
  lastUpdated?: Date | null;
};

export default function SpotsOverview({ spots, onSelect, selectedSpotId, lastUpdated }: Props) {
  const total = spots.length;
  const available = spots.filter((s) => s.status === "available");
  const reserved = spots.filter((s) => s.status === "reserved");
  const occupiedReserved = spots.filter((s) => s.status === "occupiedReserved");
  const occupiedUnauthorized = spots.filter((s) => s.status === "occupied");
  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString("es-CL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "sin datos";

  return (
    <Paper
      sx={{
        flex: 1,
        minHeight: 350, // 👉 más espacio vertical
        display: "flex",
        flexDirection: "column",
        p: 2,
      }}
    >
      <Typography variant="h6" className="font-semibold pb-1">
        Estado de estacionamientos
      </Typography>

      <Typography className="text-sm text-gray-500 pb-2">
        Total: {total} • Última actualización: {lastUpdatedLabel}
      </Typography>

      <Box className="flex gap-2 pb-2 flex-wrap">
        <Chip label={`Disponibles: ${available.length}`} color="success" size="small" />
        <Chip label={`Reservados: ${reserved.length}`} color="warning" size="small" />
        <Chip label={`Ocupados con reserva: ${occupiedReserved.length}`} color="info" size="small" />
        <Chip label={`Ocupados sin reserva: ${occupiedUnauthorized.length}`} color="error" size="small" />
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 1 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(60px, 1fr))",
            gap: 1,
          }}
        >
          {spots.map((spot) => (
            <ParkingSpotCard
              key={spot.id}
              spot={spot}
              onSelect={() => onSelect(spot)}
              selected={spot.id === selectedSpotId}
            />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
