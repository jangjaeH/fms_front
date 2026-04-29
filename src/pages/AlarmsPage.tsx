import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import type { Alarm } from "../types/fms";

export function AlarmsPage() {
  const alarms = useQuery({ queryKey: ["alarms"], queryFn: () => fetchJson<Alarm[]>("/alarms") });

  return (
    <Panel title="Alarm Center" subtitle="Ack / Resolve workflow 진입점">
      <div className="stack-list">
        {(alarms.data ?? []).map((alarm) => (
          <article key={alarm.id} className="data-card data-card--row">
            <div>
              <strong>{alarm.title}</strong>
              <p>
                {alarm.id} · {alarm.source}
              </p>
            </div>
            <StatusBadge tone={alarm.severity} label={`${alarm.severity} / ${alarm.status}`} />
          </article>
        ))}
      </div>
    </Panel>
  );
}
