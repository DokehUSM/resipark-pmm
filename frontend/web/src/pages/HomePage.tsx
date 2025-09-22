import { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import { mockSpots } from "../mock";
import CamerasPanel from "../components/camerasPanel";
import SpotsOverview from "../components/SpotsOverview";
import ActionTabs from "../components/ActionTabs";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const [pendingReservations, setPendingReservations] = useState([
    { id: "res1", resident: "Depto 101", plate: "AAA111", time: "12:30" },
    { id: "res2", resident: "Depto 202", plate: "BBB222", time: "12:40" },
  ]);

  // 👉 Cuando selecciono un spot
  const handleSelectSpot = (spot: any) => {
    setSelectedSpotId(spot.id);
    if (spot.status === "available") setSelectedCategory("new");
    if (spot.status === "occupied") setSelectedCategory("assign");
    if (spot.status === "reserved") setSelectedCategory("cancel");
  };

  // 👉 Renderiza paneles según tab/acción
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
          <Button variant="contained" color="success" fullWidth>
            Reservar
          </Button>
        </Box>
      );
    }

    if (selectedCategory === "assign") {
      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Asignar reservas
          </Typography>
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
                    <IconButton edge="end" aria-label="asignar">
                      <AssignmentTurnedInIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="cancelar">
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
          <TextField size="small" label="Código reserva" fullWidth />
          <Button variant="outlined" color="warning" fullWidth>
            Cancelar reserva
          </Button>
        </Box>
      );
    }

    return (
      <Box className="text-sm text-gray-500">
        Selecciona un estacionamiento o acción.
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flex: 1,
        height: "100%",
        overflow: "hidden",
        gap: 2,
        p: 2,
      }}
    >
      {/* Columna cámaras */}
      <CamerasPanel />

      {/* Columna derecha */}
      <Box
        sx={{
          flexBasis: "45%",
          maxWidth: "45%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <SpotsOverview
          spots={mockSpots}
          onSelect={handleSelectSpot}
          selectedSpotId={selectedSpotId}
        />
        <ActionTabs
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          pendingReservations={pendingReservations}
          renderPanel={renderPanel}
        />
      </Box>
    </Box>
  );
}
