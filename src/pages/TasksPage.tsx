import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import type { Task } from "../types/fms";

export function TasksPage() {
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchJson<Task[]>("/tasks") });

  return (
    <div className="page-grid">
      <Panel title="Task Queue" subtitle="검색 / 필터 / 정렬 확장 포인트">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Source</th>
              <th>Target</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {(tasks.data ?? []).map((task) => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.type}</td>
                <td>{task.source}</td>
                <td>{task.target}</td>
                <td>{task.status}</td>
                <td>{task.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Task Create Modal Spec" subtitle="P0 validation rules">
        <ul className="spec-list">
          <li>Source 와 Target 은 동일할 수 없습니다.</li>
          <li>`GO_CHARGE`는 Target 자동 지정 규칙을 둡니다.</li>
          <li>등록 성공 시 Task list refresh + WS event 수신을 기대합니다.</li>
        </ul>
      </Panel>
    </div>
  );
}
