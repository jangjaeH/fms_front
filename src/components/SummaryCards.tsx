import type { Summary } from "../types/fms";

const items: Array<{ key: keyof Summary; label: string }> = [
  { key: "activeRobots", label: "가동 로봇" },
  { key: "pendingTasks", label: "대기 Task" },
  { key: "activeMissions", label: "진행 Mission" },
  { key: "activeAlarms", label: "활성 Alarm" }
];

export function SummaryCards({ summary }: { summary: Summary }) {
  return (
    <div className="summary-grid">
      {items.map((item) => (
        <article key={item.key} className="summary-card">
          <span>{item.label}</span>
          <strong>{summary[item.key]}</strong>
        </article>
      ))}
    </div>
  );
}
