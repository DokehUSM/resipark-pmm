import { useState } from "react";
import {
  Box,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import UndoIcon from "@mui/icons-material/Undo";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import { mockSpots } from "../mock";
import CamerasPanel from "../components/CamerasPanel";
import SpotsOverview from "../components/SpotsOverview";
import ActionTabs from "../components/ActionTabs";

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const [pendingReservations, setPendingReservations] = useState([
    { id: "res1", resident: "Depto 101", plate: "AAA111", time: "12:30" },
    { id: "res2", resident: "Depto 202", plate: "BBB222", time: "12:40" },
  ]);

  const [assignedReservations, setAssignedReservations] = useState<
    { id: string; resident: string; plate: string; time: string; spot: string }[]
  >([
    { id: "res3", resident: "Depto 303", plate: "CCC333", time: "13:00", spot: "A1" },
  ]);

  const handleSelectSpot = (spot: any) => {
    setSelectedSpotId(spot.id);
    if (spot.status === "available") setSelectedCategory("new");
    if (spot.status === "occupied") setSelectedCategory("assign");
    if (spot.status === "reserved") setSelectedCategory("cancel");
  };

  const renderPanel = () => {
    if (selectedCategory === "new") {
      return (
        <Box className="space-y-3 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Crear nueva visita
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
      const [selectedLots, setSelectedLots] = useState<{ [key: string]: string }>({});
      const [deleteId, setDeleteId] = useState<string | null>(null);

      const availableLots = ["A1", "A2", "B1", "B2"]; // aquí puedes conectar con tus spots reales

      const handleSelectLot = (resId: string, lot: string) => {
        setSelectedLots((prev) => ({ ...prev, [resId]: lot }));
      };

      const handleAssign = (resId: string) => {
        const lot = selectedLots[resId];
        const res = pendingReservations.find((r) => r.id === resId);
        if (!res || !lot) return;

        // mover de pendientes a asignadas
        setPendingReservations((prev) => prev.filter((r) => r.id !== resId));
        setAssignedReservations((prev) => [...prev, { ...res, spot: lot }]);

        alert(`Reserva asignada al estacionamiento ${lot}`);
      };

      const handleDelete = (resId: string) => {
        setPendingReservations((prev) => prev.filter((r) => r.id !== resId));
        setDeleteId(null);
        alert("Reserva eliminada.");
      };

      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Reservar estacionamiento de visita
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
                  {/* Select + íconos */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Select
                      value={selectedLots[r.id] || ""}
                      onChange={(e) => handleSelectLot(r.id, e.target.value)}
                      size="small"
                      displayEmpty
                      sx={{ minWidth: 80 }}
                    >
                      <MenuItem value="" disabled>
                        Elegir...
                      </MenuItem>
                      {availableLots.map((lot) => (
                        <MenuItem key={lot} value={lot}>
                          {lot}
                        </MenuItem>
                      ))}
                    </Select>

                    <IconButton
                      edge="end"
                      aria-label="asignar"
                      title="Asignar estacionamiento"
                      disabled={!selectedLots[r.id]}
                      onClick={() => handleAssign(r.id)}
                    >
                      <AssignmentTurnedInIcon />
                    </IconButton>

                    <IconButton
                      edge="end"
                      aria-label="cancelar"
                      title="Eliminar reserva pendiente"
                      onClick={() => setDeleteId(r.id)}
                    >
                      <CancelIcon />
                    </IconButton>

                  </Box>
                </ListItem>
              ))}
            </List>
          )}

          {/* Confirmación de eliminar */}
          <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
            <DialogTitle>¿Estás seguro de eliminar esta visita?</DialogTitle>
            <DialogActions>
              <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button
                color="error"
                variant="contained"
                onClick={() => handleDelete(deleteId!)}
              >
                Sí, eliminar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      );
    }

    if (selectedCategory === "cancel") {
      const handleUnassign = (id: string) => {
        const res = assignedReservations.find((r) => r.id === id);
        if (!res) return;

        const ok = confirm(
          `¿Quitar el estacionamiento ${res.spot} de la reserva de ${res.resident}?`
        );
        if (!ok) return;

        setAssignedReservations((prev) => prev.filter((r) => r.id !== id));
        setPendingReservations((prev) => [
          ...prev,
          { id: res.id, resident: res.resident, plate: res.plate, time: res.time },
        ]);

        alert("Estacionamiento desasignado correctamente.");
      };

      const handleDeleteAssigned = (id: string) => {
        const res = assignedReservations.find((r) => r.id === id);
        if (!res) return;

        const ok = confirm(
          `¿Eliminar la reserva de ${res.resident} con estacionamiento ${res.spot}?`
        );
        if (!ok) return;

        setAssignedReservations((prev) => prev.filter((r) => r.id !== id));
        alert("Reserva eliminada.");
      };

      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Cancelar / desasignar reservas
          </Typography>

          {assignedReservations.length === 0 ? (
            <Typography className="text-sm text-gray-500">
              No hay reservas con estacionamiento asignado.
            </Typography>
          ) : (
            <List dense sx={{ flex: 1, overflowY: "auto" }}>
              {assignedReservations.map((r) => (
                <ListItem key={r.id} divider>
                  <ListItemText
                    primary={`${r.resident} - ${r.plate}`}
                    secondary={`Hora: ${r.time} • Est.: ${r.spot}`}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      edge="end"
                      aria-label="desasignar"
                      title="Desasignar estacionamiento"
                      onClick={() => handleUnassign(r.id)}
                    >
                      <UndoIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="eliminar"
                      title="Eliminar reserva"
                      onClick={() => handleDeleteAssigned(r.id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
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
