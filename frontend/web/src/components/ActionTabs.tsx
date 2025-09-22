import {
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Badge,
  Paper,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";

type Props = {
  selectedCategory: string | null;
  setSelectedCategory: (value: string | null) => void;
  pendingReservations: any[];
  renderPanel: () => ReactNode;
};

export default function ActionTabs({
  selectedCategory,
  setSelectedCategory,
  pendingReservations,
  renderPanel,
}: Props) {
  return (
    <>
      <ToggleButtonGroup
        exclusive
        value={selectedCategory}
        onChange={(_, value) => setSelectedCategory(value)}
        size="small"
        fullWidth
      >
        <ToggleButton value="new" sx={{ flex: 1, bgcolor: "success.light !important" }}>
          Agregar visita
        </ToggleButton>
        <ToggleButton value="assign" sx={{ flex: 1, bgcolor: "warning.light !important" }}>
          {pendingReservations.length > 0 ? (
            <Badge color="error" variant="dot">
              Reservar<br />estacionamiento
            </Badge>
          ) : (
            "Asignar reservas"
          )}
        </ToggleButton>
        <ToggleButton value="cancel" sx={{ flex: 1, bgcolor: "error.light !important" }}>
          Administrar<br />reservas
        </ToggleButton>
      </ToggleButtonGroup>

      <Divider sx={{ my: 2 }} />

      <Paper
        sx={{
          p: 2,
          flex: 1,
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          overflowX: "auto",
        }}
      >
        <Typography variant="subtitle1" className="font-semibold mb-2">
          {selectedCategory === "new"}
          {selectedCategory === "assign"}
          {selectedCategory === "cancel"}
          {!selectedCategory && "Seleccione una acción"}
        </Typography>

        {renderPanel()}
      </Paper>
    </>
  );
}
