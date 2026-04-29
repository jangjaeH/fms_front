import { useEffect } from "react";

import { useRealtimeStore } from "../store/realtimeStore";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:4000/ws";

export function useRealtimeStatus() {
  const setConnectionState = useRealtimeStore((state) => state.setConnectionState);
  const setActiveAlarms = useRealtimeStore((state) => state.setActiveAlarms);

  useEffect(() => {
    const socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      setConnectionState("connected");
    });

    socket.addEventListener("close", () => {
      setConnectionState("disconnected");
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data) as { payload?: { alarms?: unknown[]; summary?: { activeAlarms?: number } } };
      const alarmCount = message.payload?.alarms?.length ?? message.payload?.summary?.activeAlarms;
      if (typeof alarmCount === "number") {
        setActiveAlarms(alarmCount);
      }
    });

    socket.addEventListener("error", () => {
      setConnectionState("disconnected");
    });

    return () => socket.close();
  }, [setActiveAlarms, setConnectionState]);
}
