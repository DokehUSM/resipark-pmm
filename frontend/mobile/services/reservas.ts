// src/services/reservas.ts
import { API_URL } from "../config/api";

export type CrearReservaBody = {
  hora_inicio: string; // ISO string
  hora_termino: string; // ISO string
  placa_patente_visitante: string;
  numero_estacionamiento: number;
  numero_departamento: number;
};

export type CrearReservaResp =
  | {
      ok: true;
      data: {
        message: string;
        id_reserva: number;
        estado: string;
        registro_ingreso_id: number | null;
      };
    }
  | { ok: false; error: string };

export type Reserva = {
  id: number;
  hora_inicio: string;
  hora_termino: string;
  estado_reserva: string;
  rut_visitante: string;
  placa_patente_visitante: string;
};

export type ListarReservasResp =
  | { ok: true; data: Reserva[] }
  | { ok: false; error: string };

export type CancelarReservaResp =
  | { ok: true; message: string }
  | { ok: false; error: string };

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? API_URL; // ajusta segun tu entorno

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

export async function listarReservas(token: string | null): Promise<ListarReservasResp> {
  if (!token) {
    return { ok: false, error: "Sesion expirada. Vuelve a iniciar sesion" };
  }

  try {
    const res = await fetch(`${API_BASE}/reservas`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const json: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = typeof json?.detail === "string" ? json.detail : "No se pudieron obtener las reservas";
      return { ok: false, error: msg };
    }

    const list = Array.isArray(json)
      ? json
      : Array.isArray(json?.reservas)
      ? json.reservas
      : [];

    const data: Reserva[] = list.map((item: any) => ({
      id: item.id,
      hora_inicio: item.hora_inicio,
      hora_termino: item.hora_termino,
      estado_reserva: item.estado_reserva,
      rut_visitante: item.rut_visitante,
      placa_patente_visitante: item.placa_patente_visitante,
    }));

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error de red" };
  }
}

export async function cancelarReserva(id: number, token: string | null): Promise<CancelarReservaResp> {
  if (!token) {
    return { ok: false, error: "Sesion expirada. Vuelve a iniciar sesion" };
  }

  try {
    const res = await fetch(`${API_BASE}/reservas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const json: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = typeof json?.detail === "string" ? json.detail : "No se pudo cancelar la reserva";
      return { ok: false, error: msg };
    }

    const message = typeof json?.message === "string" ? json.message : "Reserva cancelada";
    return { ok: true, message };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error de red" };
  }
}
