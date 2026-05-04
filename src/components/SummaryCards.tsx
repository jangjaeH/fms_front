import { Link } from "react-router-dom";

import type { Summary } from "../types/fms";

const items: Array<{ key: keyof Summary; label: string; to: string }> = [
  { key: "activeRobots", label: "가동 로봇", to: "/map" },
  { key: "pendingTasks", label: "대기 Task", to: "/tasks" },
  { key: "activeMissions", label: "진행 Mission", to: "/missions" },
  { key: "activeAlarms", label: "활성 Alarm", to: "/alarms" }
];

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <Link key={item.key} to={item.to} className="summary-card summary-card--link">
          <span>{item.label}</span>
          <strong>{summary[item.key]}</strong>
        </Link>
      ))}
    </div>
  );
}
