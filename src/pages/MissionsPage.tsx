import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { fetchJson, postJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { usePersistentState } from "../hooks/usePersistentState";
import type { Mission, OverrideAction, OverrideInput, Robot } from "../types/fms";

const overrideActions: OverrideAction[] = ["PAUSE", "RESUME", "CANCEL", "REASSIGN"];
const missionStates: Mission["state"][] = ["QUEUED", "RUNNING", "PAUSED", "COMPLETED"];

export function MissionsPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => fetchJson<Mission[]>("/missions") });
  const robots = useQuery({ queryKey: ["robots"], queryFn: () => fetchJson<Robot[]>("/robots") });
  const [selectedMissionId, setSelectedMissionId] = usePersistentState("missions.selectedMissionId", "");
  const [overrideForm, setOverrideForm] = useState<OverrideInput>({
    operator: "operator.demo",
    action: "PAUSE",
    reason: "",
    targetRobotId: ""
  });
  const [errorText, setErrorText] = useState<string | null>(null);

  const overrideMutation = useMutation({
    mutationFn: ({ missionId, body }: { missionId: string; body: OverrideInput }) =>
      postJson<Mission, OverrideInput>(`/missions/${missionId}/override`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      setErrorText(null);
      setOverrideForm((current) => ({ ...current, reason: "", targetRobotId: "" }));
    },
    onError: (error: Error) => {
      setErrorText(error.message);
    }
  });

  const selectedMission = useMemo(
    () => (missions.data ?? []).find((mission) => mission.id === selectedMissionId) ?? missions.data?.[0],
    [missions.data, selectedMissionId]
  );
  const metrics = useMemo(() => {
    const list = missions.data ?? [];
    return {
      overrideWaiting: list.filter((mission) => mission.needsManualOverride).length,
      rerouteSearching: list.filter((mission) => mission.currentStep.includes("PATH")).length,
      manualIntervention: list.filter((mission) => mission.state === "PAUSED" || mission.needsManualOverride).length
    };
  }, [missions.data]);

  useEffect(() => {
    const missionId = searchParams.get("mission");
    if (missionId) {
      setSelectedMissionId(missionId);
    }
  }, [searchParams, setSelectedMissionId]);

  const submitOverride = () => {
    if (!selectedMission) {
      setErrorText("Select a mission first.");
      return;
    }
    if (!overrideForm.reason.trim()) {
      setErrorText("Reason is required.");
      return;
    }
    if (overrideForm.action === "REASSIGN" && !overrideForm.targetRobotId) {
      setErrorText("Select a target robot for reassignment.");
      return;
    }
    overrideMutation.mutate({ missionId: selectedMission.id, body: overrideForm });
  };

  if (missions.isLoading) {
    return <p className="state-message">Mission 데이터를 불러오는 중입니다.</p>;
  }

  if (missions.isError) {
    return (
      <p className="state-message">
        Mission 데이터를 불러오지 못했습니다. <button onClick={() => void missions.refetch()}>Retry</button>
      </p>
    );
  }

  return (
    <div className="page-grid">
      <Panel title="Mission Board" subtitle="Track mission state and perform overrides">
        <div className="mini-kpi-grid">
          <article>
            <span>재할당 대기</span>
            <strong>{metrics.overrideWaiting}</strong>
          </article>
          <article>
            <span>재경로 탐색</span>
            <strong>{metrics.rerouteSearching}</strong>
          </article>
          <article>
            <span>수동 개입</span>
            <strong>{metrics.manualIntervention}</strong>
          </article>
        </div>
        <div className="kanban-board">
          {missionStates.map((state) => (
            <section key={state} className="kanban-column">
              <h3>{state}</h3>
              {(missions.data ?? [])
                .filter((mission) => mission.state === state)
                .map((mission) => (
                  <button
                    key={mission.id}
                    className={`data-card data-card--button ${selectedMission?.id === mission.id ? "data-card--selected" : ""}`}
                    onClick={() => setSelectedMissionId(mission.id)}
                    type="button"
                  >
                    <strong>{mission.id}</strong>
                    <span>Robot {mission.robotId}</span>
                    <span>{mission.currentStep}</span>
                    <span>Progress {mission.progress}%</span>
                    {mission.needsManualOverride ? <StatusBadge tone="warning" label="MANUAL" /> : null}
                  </button>
                ))}
              {(missions.data ?? []).filter((mission) => mission.state === state).length === 0 ? (
                <p className="empty-column">No missions</p>
              ) : null}
            </section>
          ))}
        </div>
      </Panel>
      <Panel title="Manual Override" subtitle="Reason capture and operator confirmation">
        {selectedMission ? (
          <>
            <div className="stack-list">
              <div className="data-card">
                <strong>{selectedMission.id}</strong>
                <span>Robot {selectedMission.robotId}</span>
                <span>Step {selectedMission.currentStep}</span>
              </div>
            </div>
            <div className="form-grid">
              <Field label="Action">
                <select
                  value={overrideForm.action}
                  onChange={(event) =>
                    setOverrideForm((current) => ({ ...current, action: event.target.value as OverrideAction }))
                  }
                >
                  {overrideActions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target Robot">
                <select
                  disabled={overrideForm.action !== "REASSIGN"}
                  value={overrideForm.targetRobotId ?? ""}
                  onChange={(event) => setOverrideForm((current) => ({ ...current, targetRobotId: event.target.value }))}
                >
                  <option value="">Select robot</option>
                  {(robots.data ?? []).map((robot) => (
                    <option key={robot.id} value={robot.id}>
                      {robot.id}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reason">
                <input
                  value={overrideForm.reason}
                  onChange={(event) => setOverrideForm((current) => ({ ...current, reason: event.target.value }))}
                />
              </Field>
            </div>
            {errorText ? <p className="error-text">{errorText}</p> : null}
            <div className="toolbar__actions">
              <ActionButton tone="danger" onClick={submitOverride} disabled={overrideMutation.isPending}>
                {overrideMutation.isPending ? "Submitting..." : "Apply Override"}
              </ActionButton>
            </div>
          </>
        ) : (
          <p className="state-message">Select a mission to manage override actions.</p>
        )}
      </Panel>
      <Panel title="Dispatch Rules" subtitle="nearest robot + battery threshold + reservation check">
        <ul className="spec-list">
          <li>Nearest available robot is preferred for queued tasks.</li>
          <li>Battery threshold: 35% minimum for MOVE/PICK/DROP, charger task can override.</li>
          <li>Reservation check blocks missions that would collide with reserved cells.</li>
        </ul>
      </Panel>
      <Panel title="Manual Override Queue" subtitle="운영 개입이 필요한 Mission">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mission</th>
              <th>Robot</th>
              <th>Step</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(missions.data ?? [])
              .filter((mission) => mission.needsManualOverride || mission.state === "PAUSED")
              .map((mission) => (
                <tr key={mission.id} onClick={() => setSelectedMissionId(mission.id)}>
                  <td>{mission.id}</td>
                  <td>{mission.robotId}</td>
                  <td>{mission.currentStep}</td>
                  <td>
                    <ActionButton tone="neutral" onClick={() => setSelectedMissionId(mission.id)}>
                      Review
                    </ActionButton>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
