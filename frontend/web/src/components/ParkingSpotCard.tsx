import type { ParkingSpot } from "../types";
import { Paper, Typography } from "@mui/material";
import clsx from "clsx";

type ParkingSpotCardProps = {
  spot: ParkingSpot;
  onSelect?: () => void;
  selected?: boolean;
};

export default function ParkingSpotCard({ spot, onSelect, selected }: ParkingSpotCardProps) {
  const { status, code } = spot;

  const stylesMap: Record<ParkingSpot["status"], string> = {
    available: "bg-green-50 border-green-500 text-green-900",
    reserved: "bg-yellow-50 border-yellow-500 text-yellow-900",
    occupied: "bg-red-50 border-red-500 text-red-900",
    occupiedReserved: "bg-blue-50 border-blue-500 text-blue-900",
  };
  const styles = stylesMap[status] ?? stylesMap.available;

  return (
    <Paper
      component={onSelect ? "button" : "div"}
      elevation={0}
      onClick={onSelect}
      className={clsx(
        "aspect-square flex items-center justify-center border-4 rounded-md font-bold text-lg transition",
        styles,
        onSelect && "cursor-pointer hover:opacity-80",
        selected && "ring-4 ring-indigo-500 bg-indigo-100 shadow-lg"
      )}
      aria-pressed={onSelect ? selected : undefined}
      type={onSelect ? "button" : undefined}
    >
      <Typography variant="body1">{code}</Typography>
    </Paper>
  );
}
