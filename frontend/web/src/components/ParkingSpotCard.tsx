import type { ParkingSpot } from "../types";
import { Paper, Typography } from "@mui/material";
import clsx from "clsx";

type ParkingSpotCardProps = {
  spot: ParkingSpot;
  onSelect?: () => void;
  selected?: boolean;
};

export default function ParkingSpotCard({ spot, onSelect, selected }: ParkingSpotCardProps) {
  const color =
    spot.status === "available"
      ? "bg-green-100 border-green-300"
      : spot.status === "reserved"
        ? "bg-yellow-100 border-yellow-300"
        : "bg-red-100 border-red-300";

  const statusLabel =
    spot.status === "available" ? "Disponible" : spot.status === "reserved" ? "Reservado" : "Ocupado";

  return (
    <Paper
      component={onSelect ? "button" : "div"}
      elevation={0}
      onClick={onSelect}
      className={clsx(
        "h-full w-full select-none rounded-lg border p-3 text-left transition focus:outline-none",
        color,
        onSelect && "cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400",
        selected && "ring-2 ring-indigo-400"
      )}
      aria-pressed={onSelect ? selected : undefined}
      type={onSelect ? "button" : undefined}
    >
      <Typography className="font-semibold">{spot.code}</Typography>
      <Typography className="text-sm text-gray-600">Desde: {spot.since}</Typography>
      <Typography className="mt-1 text-xs uppercase tracking-wide text-gray-500">Estado: {statusLabel}</Typography>
    </Paper>
  );
}
