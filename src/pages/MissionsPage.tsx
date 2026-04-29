import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchJson, postJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import type { Mission, OverrideAction, OverrideInput, Robot } from "../types/fms";

const overrideActions: OverrideAction[] = ["PAUSE", "RESUME", "CANCEL", "REASSIGN"];

export function MissionsPage() {
  const queryClient = useQueryClient();
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => fetchJson<Mission[]>("/missions") });
  const robots = useQuery({ queryKey: ["robots"], queryFn: () => fetchJson<Robot[]>("/robots") });
  const [selectedMissionId, setSelectedMissionId] = useState<string>("");
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

  return (
    <div className="page-grid">
      <Panel title="Mission Board" subtitle="Track mission state and perform overrides">
        <div className="mission-board">
          {(missions.data ?? []).map((mission) => (
            <article
              key={mission.id}
              className={`data-card ${selectedMission?.id === mission.id ? "data-card--selected" : ""}`}
              onClick={() => setSelectedMissionId(mission.id)}
            >
              <strong>{mission.id}</strong>
              <span>{mission.state}</span>
              <span>{mission.currentStep}</span>
              <span>Progress {mission.progress}%</span>
            </article>
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
    </div>
  );
}
