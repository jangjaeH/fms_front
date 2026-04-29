import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchJson, patchJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import type { Alarm } from "../types/fms";

export function AlarmsPage() {
  const queryClient = useQueryClient();
  const alarms = useQuery({ queryKey: ["alarms"], queryFn: () => fetchJson<Alarm[]>("/alarms") });
  const alarmMutation = useMutation({
    mutationFn: ({ alarmId, action }: { alarmId: string; action: "ack" | "resolve" }) =>
      patchJson<Alarm, { user: string }>(`/alarms/${alarmId}/${action}`, { user: "operator.demo" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alarms"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  return (
    <Panel title="Alarm Center" subtitle="Acknowledge and resolve live alarms">
      <div className="stack-list">
        {(alarms.data ?? []).map((alarm) => (
          <article key={alarm.id} className="data-card">
            <div>
              <strong>{alarm.title}</strong>
              <p>
                {alarm.id} | {alarm.source}
              </p>
              <p>{new Date(alarm.createdAt).toLocaleString("ko-KR")}</p>
            </div>
            <div className="card-actions">
              <StatusBadge tone={alarm.severity} label={`${alarm.severity} / ${alarm.status}`} />
              <ActionButton
                tone="neutral"
                disabled={alarm.status !== "OPEN" || alarmMutation.isPending}
                onClick={() => alarmMutation.mutate({ alarmId: alarm.id, action: "ack" })}
              >
                Ack
              </ActionButton>
              <ActionButton
                disabled={alarm.status === "RESOLVED" || alarmMutation.isPending}
                onClick={() => alarmMutation.mutate({ alarmId: alarm.id, action: "resolve" })}
              >
                Resolve
              </ActionButton>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}
