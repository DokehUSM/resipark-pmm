// src/services/reservas.ts
import { API_URL } from "../config/api";

export type CrearReservaBody = {
  hora_inicio: string;               // ISO string
  hora_termino: string;              // ISO string
  placa_patente_visitante: string;
  numero_estacionamiento: number;
  numero_departamento: number;
};

export type CrearReservaResp =
  | { ok: true; data: { message: string; id_reserva: number; estado: string; registro_ingreso_id: number | null } }
  | { ok: false; error: string };

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? API_URL; // ajusta según tu entorno

export async function crearReserva(body: CrearReservaBody): Promise<CrearReservaResp> {
  try {
    const res = await fetch(`${API_BASE}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = typeof json?.detail === "string" ? json.detail : "Error al crear la reserva";
      return { ok: false, error: msg };
    }
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error de red" };
  }
}
