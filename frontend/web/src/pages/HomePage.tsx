import { useState } from "react";
import {
  Box,
  Divider,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Badge,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import { mockSpots } from "../mock";
import ParkingSpotCard from "../components/ParkingSpotCard";

// Mock reservas pendientes
const initialReservations = [
  { id: "res1", resident: "Depto 101", plate: "AAA111", time: "12:30" },
  { id: "res2", resident: "Depto 202", plate: "BBB222", time: "12:40" },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [pendingReservations, setPendingReservations] = useState(initialReservations);

  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [selectedOccupiedSpot, setSelectedOccupiedSpot] = useState<string | "">("");
  const [selectedReservedSpot, setSelectedReservedSpot] = useState<string | "">("");
  const [startTime, setStartTime] = useState("12:00");

  // Agrupaciones
  const totalSpots = mockSpots.length;
  const availableSpots = mockSpots.filter((s) => s.status === "available");
  const reservedSpots = mockSpots.filter((s) => s.status === "reserved");
  const occupiedSpots = mockSpots.filter((s) => s.status === "occupied");

  // Acciones
  const handleCancelReservation = (id: string) => {
    setPendingReservations((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAssignReservation = (spotId: string, resId: string) => {
    alert(`Asignar reserva ${resId} al spot ${spotId}`);
    setPendingReservations((prev) => prev.filter((r) => r.id !== resId));
  };

  const handleNewReservation = () => {
    alert(`Nueva reserva creada`);
    setPendingReservations((prev) => [
      ...prev,
      {
        id: `res${prev.length + 1}`,
        resident: "Nuevo visitante",
        plate: "XXX000",
        time: startTime,
      },
    ]);
  };

  // Calcular hora fin (+5h desde inicio)
  const getEndTime = (start: string) => {
    const [h, m] = start.split(":").map(Number);
    const end = new Date();
    end.setHours(h + 5, m);
    return end.toTimeString().slice(0, 5);
  };

  // Panel contextual
  const renderPanel = () => {
    if (selectedCategory === "new") {
      return (
        <Box className="space-y-3 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Crear nueva reserva
          </Typography>
          <TextField size="small" label="Patente" fullWidth />
          <TextField size="small" label="RUT" fullWidth />
          <TextField size="small" label="Depto destino" fullWidth />

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              size="small"
              label="Hora inicio"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              fullWidth
            />
            <TextField
              size="small"
              label="Hora fin"
              type="time"
              value={getEndTime(startTime)}
              disabled
              fullWidth
            />
          </Box>

          <Button
            variant="contained"
            color="success"
            fullWidth
            onClick={handleNewReservation}
          >
            Reservar
          </Button>
        </Box>
      );
    }

    if (selectedCategory === "assign") {
      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Asignar reservas a ocupados
          </Typography>
          <Select
            size="small"
            fullWidth
            value={selectedOccupiedSpot}
            onChange={(e) => setSelectedOccupiedSpot(e.target.value)}
          >
            {occupiedSpots.map((spot) => (
              <MenuItem key={spot.id} value={spot.id}>
                {spot.code}
              </MenuItem>
            ))}
          </Select>
          {pendingReservations.length === 0 ? (
            <Typography className="text-sm text-gray-500">
              No hay reservas pendientes.
            </Typography>
          ) : (
            <List dense sx={{ flex: 1, overflowY: "auto" }}>
              {pendingReservations.map((r) => (
                <ListItem key={r.id} divider>
                  <ListItemText
                    primary={`${r.resident} - ${r.plate}`}
                    secondary={`Hora: ${r.time}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="asignar"
                      onClick={() =>
                        handleAssignReservation(selectedOccupiedSpot, r.id)
                      }
                    >
                      <AssignmentTurnedInIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="cancelar"
                      onClick={() => handleCancelReservation(r.id)}
                    >
                      <CancelIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      );
    }

    if (selectedCategory === "cancel") {
      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Cancelar reservas
          </Typography>
          {reservedSpots.length === 0 ? (
            <Typography className="text-sm text-gray-500">
              No hay reservas para cancelar.
            </Typography>
          ) : (
            <Select
              size="small"
              fullWidth
              value={selectedReservedSpot}
              onChange={(e) => setSelectedReservedSpot(e.target.value)}
            >
              {reservedSpots.map((spot) => (
                <MenuItem key={spot.id} value={spot.id}>
                  {spot.code}
                </MenuItem>
              ))}
            </Select>
          )}
          <Button variant="outlined" color="warning" fullWidth>
            Cancelar reserva
          </Button>
        </Box>
      );
    }

    return (
      <Box className="text-sm text-gray-500">
        Selecciona un estacionamiento o una acción para ver más información.
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", flex: 1, height: "100%", overflow: "hidden", gap: 2, p: 2 }}>
      {/* Columna izquierda - cámaras */}
      <Box sx={{ flexBasis: "55%", maxWidth: "55%", display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper className="flex flex-1 flex-col overflow-hidden">
          <Box className="flex items-center justify-between border-b border-gray-200 p-4">
            <Typography variant="subtitle1" className="font-semibold">
              Cámara de entrada
            </Typography>
          </Box>
          <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
            <Typography>Stream cámara de entrada</Typography>
          </Box>
        </Paper>

        <Paper className="flex flex-1 flex-col overflow-hidden">
          <Box className="flex items-center justify-between border-b border-gray-200 p-4">
            <Typography variant="subtitle1" className="font-semibold">
              Cámara de salida
            </Typography>
          </Box>
          <Box className="flex flex-1 items-center justify-center bg-gray-200 text-gray-500">
            <Typography>Stream cámara de salida</Typography>
          </Box>
        </Paper>
      </Box>

      {/* Columna derecha */}
      <Box sx={{ flexBasis: "45%", maxWidth: "45%", display: "flex", flexDirection: "column" }}>
        <Paper sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", p: 2 }}>
          <Typography variant="h6" className="font-semibold pb-1">
            Estado de estacionamientos
          </Typography>

          {/* Total + última actualización */}
          <Typography className="text-sm text-gray-500 pb-2">
            Total: {totalSpots} • Última actualización: {new Date().toLocaleTimeString()}
          </Typography>

          {/* Chips informativos */}
          <Box className="flex gap-2 pb-2 flex-wrap">
            <Chip
              label={`Disponibles: ${availableSpots.length}`}
              color="success"
              size="small"
            />
            <Chip
              label={`Reservados: ${reservedSpots.length}`}
              color="warning"
              size="small"
            />
            <Chip
              label={`Ocupados: ${occupiedSpots.length}`}
              color="error"
              size="small"
            />
          </Box>

          {/* Grid */}
          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", pr: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0.5 }}>
              {mockSpots.map((spot) => (
                <ParkingSpotCard
                  key={spot.id}
                  spot={spot}
                  onSelect={() => {
                    setSelectedSpotId(spot.id);

                    if (spot.status === "available") setSelectedCategory("new");
                    if (spot.status === "occupied") {
                      setSelectedCategory("assign");
                      setSelectedOccupiedSpot(spot.id);
                    }
                    if (spot.status === "reserved") {
                      setSelectedCategory("cancel");
                      setSelectedReservedSpot(spot.id);
                    }
                  }}
                  selected={spot.id === selectedSpotId}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tabs por acción */}
          <ToggleButtonGroup
            exclusive
            value={selectedCategory}
            onChange={(_, value) => {
              setSelectedCategory(value);
              setSelectedSpotId(null);
            }}
            size="small"
            fullWidth
          >
            <ToggleButton value="new" sx={{ flex: 1, bgcolor: "success.light !important" }}>
              Nueva reserva
            </ToggleButton>
            <ToggleButton
              value="assign"
              sx={{
                flex: 1,
                bgcolor: "warning.light !important",
              }}
            >
              {pendingReservations.length > 0 ? (
                <Badge color="error" variant="dot">
                  Asignar reservas
                </Badge>
              ) : (
                "Asignar reservas"
              )}
            </ToggleButton>
            <ToggleButton value="cancel" sx={{ flex: 1, bgcolor: "error.light !important" }}>
              Cancelar reservas
            </ToggleButton>
          </ToggleButtonGroup>

          <Divider sx={{ my: 2 }} />

          {/* Panel */}
          <Box sx={{ flex: 1, minHeight: 200, display: "flex", flexDirection: "column", overflowX: "auto" }}>
            {renderPanel()}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
