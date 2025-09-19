import { API_URL } from "../config/api";

export type SlotStatus = "libre" | "reservado" | "ocupado";

export type AvailabilitySlot = {
  id: number;
  label: string;
  status: SlotStatus;
};

export async function fetchAvailability(): Promise<
  { ok: true; data: AvailabilitySlot[] } | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_URL}/disponibilidad`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || `HTTP ${res.status}` };
    }

    const json = await res.json();
    // Tu backend devuelve { disponibilidad: [{ numero, estado }, ...] }
    const list = Array.isArray(json) ? json : json.disponibilidad;

    const data: AvailabilitySlot[] = (list ?? []).map(
      (it: { numero: number; estado: SlotStatus }) => ({
        id: it.numero,
        label: `E-${it.numero}`,
        status: it.estado,
      })
    );
    console.log(data)
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error de red" };
  }
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? API_URL;

export type AvailabilityTotals = {
  total: number;
  disponibles: number;
  reservados: number;
  ocupados: number;
};

export async function fetchAvailabilityTotals(token: string | null): Promise<
  { ok: true; data: AvailabilityTotals } | { ok: false; error: string }
> {
  if (!token) {
    return { ok: false, error: "Sesion expirada. Vuelve a iniciar sesion" };
  }

  try {
    const res = await fetch(`${API_BASE}/estacionamientos/disponibilidad`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const json: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = typeof json?.detail === "string" ? json.detail : "No se pudo obtener la disponibilidad";
      return { ok: false, error: msg };
    }

    const data: AvailabilityTotals = {
      total: Number(json?.total ?? 0),
      disponibles: Number(json?.disponibles ?? 0),
      reservados: Number(json?.reservados ?? 0),
      ocupados: Number(json?.ocupados ?? 0),
    };

    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error de red" };
  }
}
