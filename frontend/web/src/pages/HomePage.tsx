import { useEffect, useMemo, useState } from "react";
import {
  getSpotsState, getPendings, getAssigned,
  createVisit, assignParking, unassignParking, cancelReservation,
  type SpotAPI, type PendingAPI, type AssignedAPI
} from "../services/api";

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

import CamerasPanel from "../components/CamerasPanel";
import SpotsOverview from "../components/SpotsOverview";
import ActionTabs from "../components/ActionTabs";
import type { ParkingSpot } from "../types";

// Mapear estado (0=libre,1=ocupado,2=reservado) → UI
const mapSpot = (s: SpotAPI): ParkingSpot => ({
  id: s.id,
  code: s.id,
  status: s.estado === 0 ? "available" : s.estado === 1 ? "occupied" : "reserved",
});

export default function HomePage() {
  // --------- estado UI ----------
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  // Estacionamientos (reales)
  const [spots, setSpots] = useState<ParkingSpot[]>([]);

  // Reservas (reales)
  const [pendingReservations, setPendingReservations] = useState<PendingAPI[]>([]);
  const [assignedReservations, setAssignedReservations] = useState<AssignedAPI[]>([]);

  // Form "nueva visita"
  const [newPlate, setNewPlate] = useState("");
  const [newRut, setNewRut] = useState("");
  const [newDepto, setNewDepto] = useState("");

  // Estados auxiliares del panel "assign"
  const [selectedLots, setSelectedLots] = useState<{ [id: string]: string }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // --------- carga inicial / refrescos ----------
  useEffect(() => {
    const loadAll = async () => {
      try {
        const [sp, pend, asg] = await Promise.all([
          getSpotsState(),
          getPendings(),
          getAssigned(),
        ]);
        setSpots(sp.data.map(mapSpot));
        setPendingReservations(pend.data);
        setAssignedReservations(asg.data);
      } catch (e) {
        console.error("Error cargando dashboard:", e);
      }
    };
    loadAll();

    // Polling liviano para estado de spots (cada 10s)
    const t = setInterval(async () => {
      try {
        const sp = await getSpotsState();
        setSpots(sp.data.map(mapSpot));
      } catch {}
    }, 10_000);
    return () => clearInterval(t);
  }, []);

  // Lotes disponibles (desde la BD)
  const availableLots = useMemo(
    () => spots.filter((s) => s.status === "available").map((s) => s.code),
    [spots]
  );

  // --------- helpers ----------
  const handleSelectSpot = (spot: ParkingSpot) => {
    setSelectedSpotId(spot.id);
    if (spot.status === "available") setSelectedCategory("new");
    if (spot.status === "occupied") setSelectedCategory("assign");
    if (spot.status === "reserved") setSelectedCategory("cancel");
  };

  const iso = (d: Date) => d.toISOString();

  // Crear visita
  const onCreateVisit = async () => {
    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 60 * 1000);
    try {
      await createVisit({
        patente: newPlate.trim(),
        rut: newRut.trim(),
        depto: newDepto.trim(),
        hora_inicio: iso(now),
        hora_termino: iso(in60),
      });
      const [pend, sp] = await Promise.all([getPendings(), getSpotsState()]);
      setPendingReservations(pend.data);
      setSpots(sp.data.map(mapSpot));
      setNewPlate(""); setNewRut(""); setNewDepto("");
      alert("Reserva creada");
      setSelectedCategory("assign"); // pasa al siguiente paso
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "No se pudo crear la reserva");
    }
  };

  // Asignar estacionamiento a una reserva pendiente
  const handleAssign = async (resId: string) => {
    const lot = selectedLots[resId];
    const res = pendingReservations.find((r) => String(r.id) === resId);
    if (!res || !lot) return;

    try {
      await assignParking(res.id, lot);
      const [pend, asg, sp] = await Promise.all([getPendings(), getAssigned(), getSpotsState()]);
      setPendingReservations(pend.data);
      setAssignedReservations(asg.data);
      setSpots(sp.data.map(mapSpot));
      alert(`Reserva asignada al estacionamiento ${lot}`);
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "No se pudo asignar");
    }
  };

  // Eliminar (cancelar) reserva pendiente
  const handleDeletePending = async (resId: string) => {
    const res = pendingReservations.find((r) => String(r.id) === resId);
    if (!res) return;
    try {
      await cancelReservation(res.id);
      const [pend, sp] = await Promise.all([getPendings(), getSpotsState()]);
      setPendingReservations(pend.data);
      setSpots(sp.data.map(mapSpot));
      alert("Reserva eliminada.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "No se pudo eliminar");
    } finally {
      setDeleteId(null);
    }
  };

  // Desasignar reserva (vuelve a pendientes)
  const handleUnassign = async (id: string) => {
    const res = assignedReservations.find((r) => String(r.id) === id);
    if (!res) return;
    const ok = confirm(`¿Quitar el estacionamiento ${res.est} de la reserva del depto ${res.depto}?`);
    if (!ok) return;

    try {
      await unassignParking(res.id);
      const [pend, asg, sp] = await Promise.all([getPendings(), getAssigned(), getSpotsState()]);
      setPendingReservations(pend.data);
      setAssignedReservations(asg.data);
      setSpots(sp.data.map(mapSpot));
      alert("Estacionamiento desasignado correctamente.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "No se pudo desasignar");
    }
  };

  // Eliminar (cancelar) reserva asignada
  const handleDeleteAssigned = async (id: string) => {
    const res = assignedReservations.find((r) => String(r.id) === id);
    if (!res) return;
    const ok = confirm(`¿Eliminar la reserva del depto ${res.depto} con estacionamiento ${res.est}?`);
    if (!ok) return;

    try {
      await cancelReservation(res.id);
      const [asg, sp] = await Promise.all([getAssigned(), getSpotsState()]);
      setAssignedReservations(asg.data);
      setSpots(sp.data.map(mapSpot));
      alert("Reserva eliminada.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "No se pudo eliminar");
    }
  };

  // --------- panel derecho ----------
  const renderPanel = () => {
    if (selectedCategory === "new") {
      return (
        <Box className="space-y-3 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Crear nueva visita
          </Typography>
          <TextField size="small" label="Patente" fullWidth value={newPlate} onChange={e => setNewPlate(e.target.value)} />
          <TextField size="small" label="RUT" fullWidth value={newRut} onChange={e => setNewRut(e.target.value)} />
          <TextField size="small" label="Depto destino" fullWidth value={newDepto} onChange={e => setNewDepto(e.target.value)} />
          <Button variant="contained" color="success" fullWidth onClick={onCreateVisit}>
            Reservar
          </Button>
        </Box>
      );
    }

    if (selectedCategory === "assign") {
      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Reservar estacionamiento de visita
          </Typography>

          {pendingReservations.length === 0 ? (
            <Typography className="text-sm text-gray-500">No hay reservas pendientes.</Typography>
          ) : (
            <List dense sx={{ flex: 1, overflowY: "auto" }}>
              {pendingReservations.map((r) => (
                <ListItem key={r.id} divider>
                  <ListItemText
                    primary={`${r.depto} - ${r.patente}`}
                    secondary={`Hora: ${new Date(r.hora_inicio).toLocaleTimeString()}`}
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Select
                      value={selectedLots[String(r.id)] || ""}
                      onChange={(e) => setSelectedLots(prev => ({ ...prev, [String(r.id)]: String(e.target.value) }))}
                      size="small"
                      displayEmpty
                      sx={{ minWidth: 100 }}
                    >
                      <MenuItem value="" disabled> Elegir… </MenuItem>
                      {availableLots.map((lot) => (
                        <MenuItem key={lot} value={lot}>{lot}</MenuItem>
                      ))}
                    </Select>

                    <IconButton
                      edge="end"
                      aria-label="asignar"
                      title="Asignar estacionamiento"
                      disabled={!selectedLots[String(r.id)]}
                      onClick={() => handleAssign(String(r.id))}
                    >
                      <AssignmentTurnedInIcon />
                    </IconButton>

                    <IconButton
                      edge="end"
                      aria-label="cancelar"
                      title="Eliminar reserva pendiente"
                      onClick={() => setDeleteId(String(r.id))}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}

          {/* Confirmación de eliminar pendiente */}
          <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
            <DialogTitle>¿Estás seguro de eliminar esta visita?</DialogTitle>
            <DialogActions>
              <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button color="error" variant="contained" onClick={() => handleDeletePending(deleteId!)}>
                Sí, eliminar
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      );
    }

    if (selectedCategory === "cancel") {
      return (
        <Box className="space-y-2 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Cancelar / desasignar reservas
          </Typography>

          {assignedReservations.length === 0 ? (
            <Typography className="text-sm text-gray-500">No hay reservas con estacionamiento asignado.</Typography>
          ) : (
            <List dense sx={{ flex: 1, overflowY: "auto" }}>
              {assignedReservations.map((r) => (
                <ListItem key={r.id} divider>
                  <ListItemText
                    primary={`${r.depto} - ${r.patente}`}
                    secondary={`Hora: ${new Date(r.hora_inicio).toLocaleTimeString()} • Est.: ${r.est}`}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      edge="end"
                      aria-label="desasignar"
                      title="Desasignar estacionamiento"
                      onClick={() => handleUnassign(String(r.id))}
                    >
                      <UndoIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="eliminar"
                      title="Eliminar reserva"
                      onClick={() => handleDeleteAssigned(String(r.id))}
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

    return <Box className="text-sm text-gray-500">Selecciona un estacionamiento o acción.</Box>;
  };

  // --------- layout ----------
  return (
    <Box sx={{ display: "flex", flex: 1, height: "100%", overflow: "hidden", gap: 2, p: 2 }}>
      {/* Columna cámaras */}
      <CamerasPanel />

      {/* Columna derecha */}
      <Box sx={{ flexBasis: "45%", maxWidth: "45%", display: "flex", flexDirection: "column" }}>
        <SpotsOverview
          spots={spots}
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
