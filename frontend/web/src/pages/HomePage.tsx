import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const REFRESH_MS = 5_000;

// Mapear estado (0=libre,1=ocupado,2=reservado) → UI
const mapSpot = (s: SpotAPI, assignedSpotIds: Set<string>): ParkingSpot => {
  const spotId = String(s.id);
  let status: ParkingSpot["status"];
  if (s.estado === 0) status = "available";
  else if (s.estado === 2) status = "reserved";
  else if (assignedSpotIds.has(spotId)) status = "occupiedReserved";
  else status = "occupied";

  return {
    id: s.id,
    code: s.id,
    status,
  };
};

const toArray = <T,>(input: unknown, fallback: T[] = []): T[] => {
  if (Array.isArray(input)) return input as T[];
  if (input && typeof input === "object" && Array.isArray((input as any).data)) {
    return (input as any).data as T[];
  }
  return fallback;
};

const isPlateValid = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length >= 5 && trimmed.length <= 8;
};

type RutEvaluation = {
  normalized: string;
  looksLikeRut: boolean;
  isValid: boolean;
  submitValue: string;
};

const evaluateRut = (value: string): RutEvaluation => {
  const normalized = value.trim().toUpperCase();
  const cleaned = normalized.replace(/\./g, "").replace(/-/g, "");

  if (!cleaned) {
    return { normalized, looksLikeRut: false, isValid: true, submitValue: normalized };
  }

  if (!/^\d{1,8}[0-9K]$/.test(cleaned)) {
    return { normalized, looksLikeRut: false, isValid: true, submitValue: normalized };
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  let multiplier = 2;
  let sum = 0;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expected = 11 - (sum % 11);
  const dvExpected = expected === 11 ? "0" : expected === 10 ? "K" : String(expected);
  const formatted = `${body}-${dv}`;

  return {
    normalized,
    looksLikeRut: true,
    isValid: dv === dvExpected,
    submitValue: formatted,
  };
};

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;     // <- marcar montado (también en el remount de StrictMode)
    return () => {
      isMountedRef.current = false;  // <- marcar desmontado
    };
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [sp, pend, asg] = await Promise.all([
        getSpotsState(),
        getPendings(),
        getAssigned(),
      ]);
      if (!isMountedRef.current) return;
      const rawSpots = toArray<SpotAPI>(sp.data);
      const rawPendings = toArray<PendingAPI>(pend.data);
      const rawAssigned = toArray<AssignedAPI>(asg.data);
      const assignedSpotIds = new Set<string>(
        rawAssigned
          .map(({ est }) => (est ? String(est) : null))
          .filter((value): value is string => Boolean(value))
      );
      const now = new Date();
      setSpots(rawSpots.map((spot) => mapSpot(spot, assignedSpotIds)));
      setPendingReservations(rawPendings);
      setAssignedReservations(rawAssigned);
      setLastUpdated(now);
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    }
  }, []);

  // --------- carga inicial / refrescos ----------
  useEffect(() => {
    void loadAll();
    const timer = setInterval(() => {
      void loadAll();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadAll]);

  // Lotes disponibles (desde la BD)
  const availableLots = useMemo(
    () => spots.filter((s) => s.status === "available").map((s) => s.code),
    [spots]
  );

  // --------- helpers ----------
  const handleSelectSpot = (spot: ParkingSpot) => {
    setSelectedSpotId(spot.id);
    switch (spot.status) {
      case "available":
        setSelectedCategory("new");
        break;
      case "occupied":
        setSelectedCategory("assign");
        break;
      case "reserved":
      case "occupiedReserved":
        setSelectedCategory("cancel");
        break;
      default:
        setSelectedCategory(null);
    }
  };

  const iso = (d: Date) => d.toISOString();
  const formatTime = (value?: string | Date | null) => {
    if (!value) return "-";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Crear visita
  const onCreateVisit = async () => {
    const plate = newPlate.trim().toUpperCase().replace(/\s+/g, "");
    const rutInfo = evaluateRut(newRut);
    const rutValue = rutInfo.submitValue;
    const depto = newDepto.trim();
    const plateOk = isPlateValid(plate);
    const rutOk = !rutInfo.looksLikeRut || rutInfo.isValid;
    if (!plateOk || !rutOk || !depto) {
      alert("Revisa los datos de patente, RUT (o identificación) y departamento antes de continuar.");
      return;
    }

    const now = new Date();
    const in60 = new Date(now.getTime() + 60 * 60 * 1000);
    try {
      await createVisit({
        patente: plate,
        rut: rutValue,
        depto,
        hora_inicio: iso(now),
        hora_termino: iso(in60),
      });
      await loadAll();
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
      await loadAll();
      setSelectedLots((prev) => {
        const next = { ...prev };
        delete next[resId];
        return next;
      });
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
      await loadAll();
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
      await loadAll();
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
      await loadAll();
      alert("Reserva eliminada.");
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.detail ?? "No se pudo eliminar");
    }
  };

  // --------- panel derecho ----------
  const renderPanel = () => {
    if (selectedCategory === "new") {
      const rutInfo = evaluateRut(newRut);
      const plateOk = isPlateValid(newPlate);
      const plateError = newPlate.length > 0 && !plateOk;
      const rutError = rutInfo.looksLikeRut && !rutInfo.isValid;
      const depto = newDepto.trim();
      const deptoError = newDepto.length > 0 && !depto;
      const canSubmit = plateOk && !rutError && !deptoError && depto.length > 0;

      return (
        <Box className="space-y-3 flex-1">
          <Typography variant="subtitle1" className="font-semibold">
            Crear nueva visita
          </Typography>
          <TextField
            size="small"
            label="Patente"
            fullWidth
            value={newPlate}
            onChange={(e) =>
              setNewPlate(
                e.target.value.toUpperCase().replace(/\s+/g, "").slice(0, 8)
              )
            }
            inputProps={{ maxLength: 8 }}
            helperText={plateError ? "Debe tener entre 5 y 8 caracteres." : "Entre 5 y 8 caracteres."}
            error={plateError}
            required
          />
          <TextField
            size="small"
            label="RUT"
            fullWidth
            value={newRut}
            onChange={(e) => setNewRut(e.target.value.toUpperCase().replace(/\s+/g, ""))}
            helperText={
              rutError
                ? "RUT inválido. Revisa el dígito verificador."
                : "Formato RUT o identificación alternativa."
            }
            error={rutError}
            required
          />
          <TextField
            size="small"
            label="Depto destino"
            fullWidth
            value={newDepto}
            onChange={(e) => setNewDepto(e.target.value)}
            helperText={
              deptoError ? "Ingresa un departamento válido." : (!depto ? "Obligatorio" : "")
            }
            error={deptoError}
            required
          />
          <Button variant="contained" color="success" fullWidth onClick={onCreateVisit} disabled={!canSubmit}>
            Agregar visita
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
                    secondary={`Inicio: ${formatTime(r.hora_inicio)} • Término: ${formatTime(r.hora_termino)}`}
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
                      title="Reservar estacionamiento"
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
                    secondary={`Inicio: ${formatTime(r.hora_inicio)} • Término: ${formatTime(r.hora_termino)} • Est.: ${r.est}`}
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
          lastUpdated={lastUpdated}
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
