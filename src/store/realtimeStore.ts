import { create } from "zustand";

interface RealtimeState {
  connectionState: "connected" | "disconnected";
  activeAlarms: number;
  setConnectionState: (value: "connected" | "disconnected") => void;
  setActiveAlarms: (value: number) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connectionState: "disconnected",
  activeAlarms: 0,
  setConnectionState: (value) => set({ connectionState: value }),
  setActiveAlarms: (value) => set({ activeAlarms: value })
}));
