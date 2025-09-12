// services/login.ts
import { API_URL } from "@/config/api";

export async function login(numero_departamento: number, contrasena: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ numero_departamento, contrasena }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error en login");
  }

  return response.json();
}
