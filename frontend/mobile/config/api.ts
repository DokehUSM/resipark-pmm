// Default placeholder for local dev (update with your backend base URL when needed).
export const DEFAULT_API_URL = "http://192.168.50.19:8002";
export const API_URL_STORAGE_KEY = "apiBaseUrl";

let currentApiUrl: string | null = null;

export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

export function setCurrentApiUrl(value: string | null) {
  currentApiUrl = value ? normalizeApiUrl(value) : null;
  return currentApiUrl;
}

export function getCurrentApiUrl(): string {
  if (!currentApiUrl) {
    throw new Error("API URL not configured");
  }
  return currentApiUrl;
}

export function tryGetCurrentApiUrl(): string | null {
  return currentApiUrl;
}

export function isValidApiUrl(value: string): boolean {
  const normalized = normalizeApiUrl(value);
  if (!normalized) return false;
  return /^https?:\/\//i.test(normalized);
}
