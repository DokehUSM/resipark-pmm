import { API_URL } from "../config/api";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? API_URL;

export type CrearVisitanteBody = {
  placa_patente: string;
  rut: string;
};

export type CrearVisitanteResp =
  | { ok: true; data: { message: string; placa: string } }
  | { ok: false; error: string };

export async function crearVisitante(body: CrearVisitanteBody): Promise<CrearVisitanteResp> {
  try {
    const res = await fetch(`${API_BASE}/vehiculos/visitante`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = typeof json?.detail === "string" ? json.detail : "No se pudo registrar el visitante";
      return { ok: false, error: msg };
    }
    return { ok: true, data: json };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error de red" };
  }
}
