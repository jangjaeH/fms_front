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
  ["/map", mapFallback],
  ["/tasks", tasksFallback],
  ["/missions", missionsFallback],
  ["/missions/active", missionsFallback],
  ["/equipment", equipmentFallback],
  ["/alarms", alarmsFallback],
  ["/events", eventsFallback]
]);

export async function fetchJson<T>(path: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    const fallback = fallbackMap.get(path);
    if (fallback) {
      return fallback as T;
    }
    throw error;
  }
}
