import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { fetchJson, patchJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { usePersistentState } from "../hooks/usePersistentState";
import type { Alarm, AlarmStatus } from "../types/fms";

type AlarmFilter = AlarmStatus | "ACTIVE" | "ALL";

export function AlarmsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const alarms = useQuery({ queryKey: ["alarms"], queryFn: () => fetchJson<Alarm[]>("/alarms") });
  const [filter, setFilter] = usePersistentState<AlarmFilter>("alarms.filter", "ACTIVE");
  const [selectedAlarmId, setSelectedAlarmId] = usePersistentState("alarms.selectedAlarmId", "");
  const alarmMutation = useMutation({
    mutationFn: ({ alarmId, action }: { alarmId: string; action: "ack" | "resolve" }) =>
      patchJson<Alarm, { user: string }>(`/alarms/${alarmId}/${action}`, { user: "operator.demo" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["alarms"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });
  const filteredAlarms = useMemo(() => {
    return (alarms.data ?? [])
      .filter((alarm) => {
        if (filter === "ALL") return true;
        if (filter === "ACTIVE") return alarm.status !== "RESOLVED";
        return alarm.status === filter;
      })
      .sort((left, right) => {
        if (left.status === "OPEN" && right.status !== "OPEN") return -1;
        if (left.status !== "OPEN" && right.status === "OPEN") return 1;
        return right.createdAt.localeCompare(left.createdAt);
      });
  }, [alarms.data, filter]);
  const selectedAlarm = useMemo(
    () => (alarms.data ?? []).find((alarm) => alarm.id === selectedAlarmId) ?? filteredAlarms[0] ?? null,
    [alarms.data, filteredAlarms, selectedAlarmId]
  );
  const severitySummary = useMemo(() => {
    const active = (alarms.data ?? []).filter((alarm) => alarm.status !== "RESOLVED");
    return {
      CRITICAL: active.filter((alarm) => alarm.severity === "CRITICAL").length,
      MAJOR: active.filter((alarm) => alarm.severity === "MAJOR").length,
      MINOR: active.filter((alarm) => alarm.severity === "MINOR").length
    };
  }, [alarms.data]);

  return (
    <div className="page-grid">
      <Panel title="Alarm Center" subtitle="Acknowledge and resolve live alarms">
        <div className="mini-kpi-grid">
          {(["CRITICAL", "MAJOR", "MINOR"] as const).map((severity) => (
            <article key={severity}>
              <span>{severity}</span>
              <strong>{severitySummary[severity]}</strong>
            </article>
          ))}
        </div>
        <div className="toolbar toolbar--compact">
          <Field label="Status">
            <select value={filter} onChange={(event) => setFilter(event.target.value as AlarmFilter)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="OPEN">OPEN</option>
              <option value="ACKED">ACKED</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="ALL">ALL</option>
            </select>
          </Field>
        </div>
        {alarms.isLoading ? <p className="state-message">Alarm 데이터를 불러오는 중입니다.</p> : null}
        {alarms.isError ? (
          <p className="state-message">
            Alarm 데이터를 불러오지 못했습니다. <button onClick={() => void alarms.refetch()}>Retry</button>
          </p>
        ) : null}
        {filteredAlarms.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Alarm</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlarms.map((alarm) => (
                <tr key={alarm.id} className={selectedAlarm?.id === alarm.id ? "row-selected" : ""} onClick={() => setSelectedAlarmId(alarm.id)}>
                  <td>
                    <StatusBadge tone={alarm.severity} label={alarm.severity} />
                  </td>
                  <td>{alarm.title}</td>
                  <td>{alarm.source}</td>
                  <td>{alarm.status}</td>
                  <td>{new Date(alarm.createdAt).toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="state-message">현재 조건에 맞는 알람이 없습니다.</p>
        )}
      </Panel>
      <Panel title="Alarm Detail" subtitle="Runbook / 관련 Robot / Mission drill-down">
        {selectedAlarm ? (
          <div className="drawer-stack">
            <div className="detail-grid">
              <span>ID</span>
              <strong>{selectedAlarm.id}</strong>
              <span>Severity</span>
              <strong>{selectedAlarm.severity}</strong>
              <span>Robot</span>
              <strong>{selectedAlarm.robotId ?? "-"}</strong>
              <span>Mission</span>
              <strong>{selectedAlarm.missionId ?? "-"}</strong>
            </div>
            <div className="drawer-actions">
              <ActionButton
                tone="neutral"
                disabled={selectedAlarm.status !== "OPEN" || alarmMutation.isPending}
                onClick={() => alarmMutation.mutate({ alarmId: selectedAlarm.id, action: "ack" })}
              >
                Ack
              </ActionButton>
              <ActionButton
                disabled={selectedAlarm.status === "RESOLVED" || alarmMutation.isPending}
                onClick={() => alarmMutation.mutate({ alarmId: selectedAlarm.id, action: "resolve" })}
              >
                Resolve
              </ActionButton>
              <ActionButton tone="neutral" onClick={() => navigate(`/missions?mission=${selectedAlarm.missionId ?? ""}`)}>
                Open Mission
              </ActionButton>
            </div>
            <ul className="spec-list">
              <li>Runbook: 현장 안전 확인 후 관련 Mission 상태를 점검합니다.</li>
              <li>Critical 알람은 Ack 후에도 Resolve 전까지 활성 목록에 남습니다.</li>
              <li>Ack/Resolve는 사용자와 타임스탬프를 이벤트 로그에 남깁니다.</li>
            </ul>
          </div>
        ) : (
          <p className="state-message">알람을 선택하면 상세 대응 패널이 표시됩니다.</p>
        )}
      </Panel>
    </div>
  );
}
