import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchJson, postJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import type { Equipment } from "../types/fms";

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const equipment = useQuery({ queryKey: ["equipment"], queryFn: () => fetchJson<Equipment[]>("/equipment") });
  const resetMutation = useMutation({
    mutationFn: (equipmentId: string) => postJson<Equipment, Record<string, never>>(`/equipment/${equipmentId}/reset`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["equipment"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["alarms"] });
    }
  });
  const summary = useMemo(() => {
    const list = equipment.data ?? [];
    return {
      READY: list.filter((item) => item.state === "READY").length,
      BUSY: list.filter((item) => item.state === "BUSY").length,
      FAULT: list.filter((item) => item.state === "FAULT").length
    };
  }, [equipment.data]);

  return (
    <Panel title="Equipment Monitor" subtitle="Mock / PLC adapter 연결 예정 지점">
      <div className="mini-kpi-grid">
        {(["READY", "BUSY", "FAULT"] as const).map((state) => (
          <article key={state}>
            <span>{state}</span>
            <strong>{summary[state]}</strong>
          </article>
        ))}
      </div>
      {equipment.isLoading ? <p className="state-message">Equipment 데이터를 불러오는 중입니다.</p> : null}
      {equipment.isError ? (
        <p className="state-message">
          Equipment 데이터를 불러오지 못했습니다. <button onClick={() => void equipment.refetch()}>Retry</button>
        </p>
      ) : null}
      <div className="robot-grid">
        {(equipment.data ?? []).map((item) => (
          <article key={item.id} className="data-card">
            <strong>{item.id}</strong>
            <span>{item.type}</span>
            <StatusBadge tone={item.state} label={item.state} />
            <span>{item.signal || "No signal"}</span>
            <span>{new Date(item.lastUpdated).toLocaleString("ko-KR")}</span>
            <ActionButton tone="neutral" disabled={item.state !== "FAULT" || resetMutation.isPending} onClick={() => resetMutation.mutate(item.id)}>
              Manual Reset
            </ActionButton>
          </article>
        ))}
      </div>
    </Panel>
  );
}
