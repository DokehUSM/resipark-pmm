import { tryGetCurrentApiUrl } from "@/config/api";

export type CrearVisitanteBody = {
  placa_patente: string;
  rut: string;
};

export type CrearVisitanteResp =
  | { ok: true; data: { message: string; placa: string } }
  | { ok: false; error: string };

const CONFIG_ERROR: CrearVisitanteResp = {
  ok: false,
  error: "Configura la URL del servidor en Ajustes",
};

export async function crearVisitante(body: CrearVisitanteBody): Promise<CrearVisitanteResp> {
  const baseUrl = tryGetCurrentApiUrl();
  if (!baseUrl) return CONFIG_ERROR;

  try {
    const res = await fetch(`${baseUrl}/vehiculos/visitante`, {
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
