import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import type { Equipment } from "../types/fms";

export function EquipmentPage() {
  const equipment = useQuery({ queryKey: ["equipment"], queryFn: () => fetchJson<Equipment[]>("/equipment") });

  return (
    <Panel title="Equipment Monitor" subtitle="Mock / PLC adapter 연결 예정 지점">
      <div className="robot-grid">
        {(equipment.data ?? []).map((item) => (
          <article key={item.id} className="data-card">
            <strong>{item.id}</strong>
            <span>{item.type}</span>
            <span>{item.state}</span>
            <span>{item.signal}</span>
          </article>
        ))}
      </div>
    </Panel>
  );
}
