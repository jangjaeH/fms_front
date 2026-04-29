import { NavLink, Outlet } from "react-router-dom";

import { useRealtimeStore } from "../store/realtimeStore";
import { StatusBadge } from "./StatusBadge";

const navigation = [
  { to: "/", label: "Dashboard" },
  { to: "/map", label: "Map" },
  { to: "/tasks", label: "Tasks" },
  { to: "/missions", label: "Missions" },
  { to: "/equipment", label: "Equipment" },
  { to: "/alarms", label: "Alarms" },
  { to: "/events", label: "Events" }
];

export function AppShell() {
  const connectionState = useRealtimeStore((state) => state.connectionState);
  const activeAlarms = useRealtimeStore((state) => state.activeAlarms);

  return (
    <div className="app-shell">
      <aside className="app-shell__nav">
        <div>
          <p className="eyebrow">Mini FMS V1</p>
          <h1>Operator Console</h1>
        </div>
        <nav>
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="app-shell__content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Live Operations</p>
            <h2>실시간 관제 대시보드</h2>
          </div>
          <div className="topbar__meta">
            <StatusBadge tone={connectionState === "connected" ? "running" : "warning"} label={connectionState} />
            <span>활성 알람 {activeAlarms}</span>
            <span>Mode SIMULATION</span>
            <span>operator.demo</span>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
