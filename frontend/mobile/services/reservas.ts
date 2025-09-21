import { tryGetCurrentApiUrl } from "@/config/api";

export type CrearReservaBody = {
  hora_inicio: string;
  hora_termino: string;
  rut_visitante: string;
  placa_patente_visitante: string;
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

const CONFIG_ERROR_MESSAGE = "Configura la URL del servidor en Ajustes";

export async function crearReserva(
  body: CrearReservaBody,
  token: string | null
): Promise<CrearReservaResp> {
  if (!token) {
    return { ok: false, error: "Sesion expirada. Vuelve a iniciar sesion" };
  }

  const baseUrl = tryGetCurrentApiUrl();
  if (!baseUrl) {
    return { ok: false, error: CONFIG_ERROR_MESSAGE };
  }

  try {
    const res = await fetch(`${baseUrl}/reservas`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
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

  const baseUrl = tryGetCurrentApiUrl();
  if (!baseUrl) {
    return { ok: false, error: CONFIG_ERROR_MESSAGE };
  }

  try {
    const res = await fetch(`${baseUrl}/reservas`, {
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

export async function cancelarReserva(
  id: number,
  token: string | null
): Promise<CancelarReservaResp> {
  if (!token) {
    return { ok: false, error: "Sesion expirada. Vuelve a iniciar sesion" };
  }

  const baseUrl = tryGetCurrentApiUrl();
  if (!baseUrl) {
    return { ok: false, error: CONFIG_ERROR_MESSAGE };
  }

  try {
    const res = await fetch(`${baseUrl}/reservas/${id}`, {
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
