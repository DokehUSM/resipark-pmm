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
