// services/login.ts
import { API_URL } from "@/config/api";

export type LoginResponse = { message: string; departamento: number };
export type LoginResult =
  | { ok: true; data: LoginResponse }
  | { ok: false; error: string };

export async function login(
  numero_departamento: number,
  contrasena: string
): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ numero_departamento, contrasena }),
    });

    let json: any = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }

    if (!res.ok) {
      const detail =
        json?.detail ??
        (res.status === 401 ? "Credenciales inválidas" : "Error en login");
      return { ok: false, error: detail };
    }

    return { ok: true, data: json as LoginResponse };
  } catch {
    return { ok: false, error: "No hay conexión con el servidor" };
  }
}
