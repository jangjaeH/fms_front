import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import { SummaryCards } from "../components/SummaryCards";
import type { Mission, Robot, Summary, Task } from "../types/fms";

export function DashboardPage() {
  const summary = useQuery({ queryKey: ["summary"], queryFn: () => fetchJson<Summary>("/dashboard/summary") });
  const robots = useQuery({ queryKey: ["robots"], queryFn: () => fetchJson<Robot[]>("/robots") });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchJson<Task[]>("/tasks") });
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => fetchJson<Mission[]>("/missions/active") });

  if (summary.isLoading) {
    return <p className="state-message">Dashboard를 불러오는 중입니다.</p>;
  }

  if (summary.isError || !summary.data) {
    return <p className="state-message">Dashboard 데이터를 불러오지 못했습니다.</p>;
  }

  return (
    <div className="page-grid">
      <SummaryCards summary={summary.data} />
      <Panel title="Fleet Map Snapshot" subtitle="P0 map drill-down entry">
        <div className="robot-grid">
          {(robots.data ?? []).map((robot) => (
            <article key={robot.id} className="data-card">
              <strong>{robot.name}</strong>
              <span>{robot.state}</span>
              <span>
                {robot.currentCell} → {robot.targetCell ?? "-"}
              </span>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Task Queue" subtitle="우선순위 기준 정렬">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {(tasks.data ?? []).map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.type}</td>
                <td>{task.status}</td>
                <td>{task.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Active Missions" subtitle="Map / Mission 교차 확인">
        <div className="stack-list">
          {(missions.data ?? []).map((mission) => (
            <article key={mission.id} className="data-card">
              <strong>{mission.id}</strong>
              <span>{mission.state}</span>
              <span>{mission.currentStep}</span>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
