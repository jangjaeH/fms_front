import {
  alarmsFallback,
  equipmentFallback,
  eventsFallback,
  mapFallback,
  missionsFallback,
  robotsFallback,
  summaryFallback,
  tasksFallback
} from "../mocks/fallbackData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const fallbackMap = new Map<string, unknown>([
  ["/dashboard/summary", summaryFallback],
  ["/robots", robotsFallback],
  ["/robots/R-01", robotsFallback[0]],
  ["/robots/R-01/events", eventsFallback.filter((event) => event.source === "R-01" || event.payload.robotId === "R-01")],
  ["/robots/R-02/events", eventsFallback.filter((event) => event.source === "R-02" || event.payload.robotId === "R-02")],
  ["/robots/R-03/events", eventsFallback.filter((event) => event.source === "R-03" || event.payload.robotId === "R-03")],
  ["/map", mapFallback],
  ["/tasks", tasksFallback],
  ["/missions", missionsFallback],
  ["/missions/active", missionsFallback],
  ["/equipment", equipmentFallback],
  ["/alarms", alarmsFallback],
  ["/events", eventsFallback]
]);

async function requestJson<T>(path: string, init?: RequestInit, useFallback = true): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message ?? `Failed to fetch ${path}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (!init && useFallback) {
      const fallback = fallbackMap.get(path);
      if (fallback) {
        return fallback as T;
      }
    }
    throw error;
  }
}

export async function fetchJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function postJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  return requestJson<TResponse>(path, { method: "POST", body: JSON.stringify(body) }, false);
}

export async function patchJson<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
  return requestJson<TResponse>(path, { method: "PATCH", body: JSON.stringify(body) }, false);
}

export async function deleteJson<TResponse>(path: string): Promise<TResponse> {
  return requestJson<TResponse>(path, { method: "DELETE" }, false);
}
