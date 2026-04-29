import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import type { MapData, Robot } from "../types/fms";

export function MapPage() {
  const map = useQuery({ queryKey: ["map"], queryFn: () => fetchJson<MapData>("/map") });
  const robots = useQuery({ queryKey: ["robots"], queryFn: () => fetchJson<Robot[]>("/robots") });

  return (
    <div className="page-split">
      <Panel title="Fleet Map" subtitle="16:9 우선 레이아웃">
        <div className="map-grid">
          {Array.from({ length: (map.data?.width ?? 0) * (map.data?.height ?? 0) }).map((_, index) => {
            const x = (index % (map.data?.width ?? 1)) + 1;
            const y = Math.floor(index / (map.data?.width ?? 1)) + 1;
            const cellKey = `${String.fromCharCode(64 + x)}${y}`;
            const robot = robots.data?.find((item) => item.x === x && item.y === y);
            const blocked = map.data?.blockedCells.includes(cellKey);
            return (
              <div key={cellKey} className={`map-cell ${blocked ? "map-cell--blocked" : ""}`}>
                <span>{cellKey}</span>
                {robot ? <strong>{robot.id}</strong> : null}
              </div>
            );
          })}
        </div>
      </Panel>
      <Panel title="Fleet Summary" subtitle="상태 / 배터리 / 예약 셀">
        <div className="stack-list">
          {(robots.data ?? []).map((robot) => (
            <article key={robot.id} className="data-card">
              <strong>{robot.id}</strong>
              <span>{robot.state}</span>
              <span>Battery {robot.battery}%</span>
              <span>Reserved {robot.reservedCells.join(", ") || "-"}</span>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
