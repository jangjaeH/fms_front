import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import type { Mission } from "../types/fms";

export function MissionsPage() {
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => fetchJson<Mission[]>("/missions") });

  return (
    <div className="page-grid">
      <Panel title="Mission Board" subtitle="상태별 추적 / 재할당 / override">
        <div className="mission-board">
          {(missions.data ?? []).map((mission) => (
            <article key={mission.id} className="data-card">
              <strong>{mission.id}</strong>
              <span>{mission.state}</span>
              <span>{mission.currentStep}</span>
              <span>Progress {mission.progress}%</span>
            </article>
          ))}
        </div>
      </Panel>
      <Panel title="Override Checklist" subtitle="위험 액션은 이유 입력 + 로그 기록">
        <ul className="spec-list">
          <li>Pause / Resume / Cancel / Reassign 전에 사유를 수집합니다.</li>
          <li>Mission, Alarm, Event Log 를 동시에 갱신할 수 있게 백엔드 API를 분리했습니다.</li>
        </ul>
      </Panel>
    </div>
  );
}
