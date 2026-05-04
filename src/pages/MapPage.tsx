import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { fetchJson, patchJson, postJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";
import { usePersistentState } from "../hooks/usePersistentState";
import type { AutoTaskStatus, EventItem, MapData, Mission, OverrideInput, Robot } from "../types/fms";

type Station = MapData["stations"][number];
type Obstacle = MapData["obstacles"][number];

function polylinePoints(points: MapData["lanes"][number]["points"]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function renderStationInterior(station: Station) {
  const width = station.width ?? 110;
  const height = station.height ?? 80;
  const type = station.type.toLowerCase();

  if (type === "dock") {
    return (
      <>
        <rect className="station-detail station-detail--dock-apron" x={station.x + 10} y={station.y + height - 18} width={width - 20} height="10" rx="2" />
        {[0, 1, 2, 3].map((index) => (
          <line
            key={index}
            className="station-detail station-detail--dock-line"
            x1={station.x + 22 + index * 28}
            y1={station.y + 8}
            x2={station.x + 22 + index * 28}
            y2={station.y + height - 24}
          />
        ))}
      </>
    );
  }

  if (type === "assembly") {
    return (
      <>
        <rect className="station-detail station-detail--machine" x={station.x + 16} y={station.y + 34} width={width - 32} height={height - 48} rx="6" />
        <circle className="station-detail station-detail--signal" cx={station.x + width - 22} cy={station.y + 18} r="7" />
      </>
    );
  }

  if (type === "qc") {
    return (
      <>
        <rect className="station-detail station-detail--table" x={station.x + 18} y={station.y + 34} width={width - 36} height="18" rx="4" />
        <path className="station-detail station-detail--check" d={`M ${station.x + 24} ${station.y + 66} l 12 12 l 26 -30`} />
      </>
    );
  }

  if (type === "charger") {
    return (
      <>
        <rect className="station-detail station-detail--charger-pad" x={station.x + 22} y={station.y + 38} width={width - 44} height={height - 52} rx="8" />
        <path className="station-detail station-detail--bolt" d={`M ${station.x + width / 2 + 4} ${station.y + 18} l -24 34 h 20 l -14 30 l 34 -42 h -20 z`} />
      </>
    );
  }

  if (type === "buffer") {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <rect
            key={index}
            className="station-detail station-detail--buffer-slot"
            x={station.x + 16 + index * 34}
            y={station.y + 38}
            width="24"
            height={height - 52}
            rx="4"
          />
        ))}
      </>
    );
  }

  return null;
}

function renderObstacleInterior(obstacle: Obstacle) {
  const type = obstacle.type.toLowerCase();

  if (type === "rack") {
    return (
      <>
        {[0, 1, 2, 3, 4].map((index) => (
          <line
            key={index}
            className="obstacle-detail obstacle-detail--rack-slot"
            x1={obstacle.x + 6}
            y1={obstacle.y + 36 + index * 48}
            x2={obstacle.x + obstacle.width - 6}
            y2={obstacle.y + 36 + index * 48}
          />
        ))}
      </>
    );
  }

  if (type === "conveyor") {
    const vertical = obstacle.height > obstacle.width;
    const count = vertical ? Math.floor(obstacle.height / 26) : Math.floor(obstacle.width / 26);
    return (
      <>
        {Array.from({ length: count }).map((_, index) =>
          vertical ? (
            <line
              key={index}
              className="obstacle-detail obstacle-detail--roller"
              x1={obstacle.x + 6}
              y1={obstacle.y + 18 + index * 26}
              x2={obstacle.x + obstacle.width - 6}
              y2={obstacle.y + 18 + index * 26}
            />
          ) : (
            <line
              key={index}
              className="obstacle-detail obstacle-detail--roller"
              x1={obstacle.x + 18 + index * 26}
              y1={obstacle.y + 6}
              x2={obstacle.x + 18 + index * 26}
              y2={obstacle.y + obstacle.height - 6}
            />
          )
        )}
      </>
    );
  }

  if (type === "dock_door") {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <line
            key={index}
            className="obstacle-detail obstacle-detail--door-slat"
            x1={obstacle.x + 4}
            y1={obstacle.y + 14 + index * 16}
            x2={obstacle.x + obstacle.width - 4}
            y2={obstacle.y + 14 + index * 16}
          />
        ))}
      </>
    );
  }

  return null;
}

export function MapPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const map = useQuery({ queryKey: ["map"], queryFn: () => fetchJson<MapData>("/map"), refetchInterval: 3000 });
  const robots = useQuery({ queryKey: ["robots"], queryFn: () => fetchJson<Robot[]>("/robots"), refetchInterval: 1000 });
  const missions = useQuery({ queryKey: ["missions"], queryFn: () => fetchJson<Mission[]>("/missions") });
  const autoTasks = useQuery({
    queryKey: ["auto-tasks"],
    queryFn: () => fetchJson<AutoTaskStatus>("/simulation/auto-tasks"),
    refetchInterval: 2000
  });
  const [selectedRobotId, setSelectedRobotId] = usePersistentState("map.selectedRobotId", "");
  const [showTrafficLayer, setShowTrafficLayer] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showObstacles, setShowObstacles] = useState(true);
  const selectedRobot = useMemo(
    () => (robots.data ?? []).find((robot) => robot.id === selectedRobotId) ?? null,
    [robots.data, selectedRobotId]
  );
  const selectedMission = useMemo(
    () => (missions.data ?? []).find((mission) => mission.id === selectedRobot?.missionId) ?? null,
    [missions.data, selectedRobot]
  );
  const robotEvents = useQuery({
    queryKey: ["robot-events", selectedRobotId],
    queryFn: () => fetchJson<EventItem[]>(`/robots/${selectedRobotId}/events`),
    enabled: Boolean(selectedRobotId)
  });
  const overrideMutation = useMutation({
    mutationFn: ({ missionId, body }: { missionId: string; body: OverrideInput }) =>
      postJson<Mission, OverrideInput>(`/missions/${missionId}/override`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
      await queryClient.invalidateQueries({ queryKey: ["robot-events", selectedRobotId] });
    }
  });
  const autoTaskToggleMutation = useMutation({
    mutationFn: (enabled: boolean) => patchJson<AutoTaskStatus, { enabled: boolean }>("/simulation/auto-tasks", { enabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auto-tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });
  const autoTaskRunMutation = useMutation({
    mutationFn: () => postJson<AutoTaskStatus, Record<string, never>>("/simulation/auto-tasks/run", {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auto-tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["missions"] });
      await queryClient.invalidateQueries({ queryKey: ["robots"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  const submitQuickAction = (action: "PAUSE" | "RESUME") => {
    if (!selectedMission) {
      return;
    }

    overrideMutation.mutate({
      missionId: selectedMission.id,
      body: {
        operator: "operator.demo",
        action,
        reason: `${action} requested from map robot drawer`
      }
    });
  };

  if (map.isLoading || robots.isLoading) {
    return <p className="state-message">Map 데이터를 불러오는 중입니다.</p>;
  }

  if (map.isError || !map.data) {
    return (
      <p className="state-message">
        맵 데이터를 불러오지 못했습니다. <button onClick={() => void map.refetch()}>Retry</button>
      </p>
    );
  }

  const zones = map.data.zones ?? [];
  const lanes = map.data.lanes ?? [];
  const stations = map.data.stations ?? [];
  const obstacles = map.data.obstacles ?? [];

  return (
    <div className="page-split">
      <Panel title="Facility Digital Twin" subtitle="1000x1000 설비 좌표 / 도크-랙-공정-출하 흐름">
        <div className="toolbar toolbar--compact">
          <label className="check-row">
            <input type="checkbox" checked={showTrafficLayer} onChange={(event) => setShowTrafficLayer(event.target.checked)} />
            주행 경로
          </label>
          <label className="check-row">
            <input type="checkbox" checked={showStations} onChange={(event) => setShowStations(event.target.checked)} />
            설비
          </label>
          <label className="check-row">
            <input type="checkbox" checked={showObstacles} onChange={(event) => setShowObstacles(event.target.checked)} />
            장애물
          </label>
        </div>
        <div className="facility-map-shell">
          <svg className="facility-map" viewBox={`0 0 ${map.data.width} ${map.data.height}`} role="img" aria-label="1000 by 1000 facility robot map">
            <defs>
              <pattern id="facilityGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="1" />
              </pattern>
              <pattern id="floorNoise" width="24" height="24" patternUnits="userSpaceOnUse">
                <rect width="24" height="24" fill="#222a30" />
                <path d="M 4 7 H 18 M 8 18 H 22" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              </pattern>
              <filter id="robotShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.35" />
              </filter>
            </defs>
            <rect className="facility-floor" x="0" y="0" width={map.data.width} height={map.data.height} />
            <rect className="facility-floor-texture" x="36" y="36" width={map.data.width - 72} height={map.data.height - 72} fill="url(#floorNoise)" />
            <rect x="0" y="0" width={map.data.width} height={map.data.height} fill="url(#facilityGrid)" />
            <rect className="facility-boundary" x="28" y="28" width={map.data.width - 56} height={map.data.height - 56} />
            <rect className="facility-yard" x="28" y="940" width={map.data.width - 56} height="32" />
            <text className="yard-label" x="42" y="963">
              TRUCK APRON
            </text>

            {zones.map((zone) => (
              <g key={zone.id}>
                <rect className={`facility-zone facility-zone--${zone.type.toLowerCase()}`} x={zone.x} y={zone.y} width={zone.width} height={zone.height} rx="12" />
                <text className="facility-zone-label" x={zone.x + 14} y={zone.y + 28}>
                  {zone.label}
                </text>
              </g>
            ))}

            {lanes.map((lane) => (
              <g key={lane.id}>
                <polyline
                  className="facility-lane facility-lane--base"
                  points={polylinePoints(lane.points)}
                  strokeWidth={lane.width}
                />
                <polyline
                  className="facility-lane facility-lane--center"
                  points={polylinePoints(lane.points)}
                />
                <text className="facility-lane-label" x={lane.points[0]?.x ?? 0} y={(lane.points[0]?.y ?? 0) - 18}>
                  {lane.label}
                </text>
              </g>
            ))}

            {showTrafficLayer
              ? (robots.data ?? []).map((robot) =>
                  robot.route.length > 1 ? (
                    <polyline
                      key={`${robot.id}-route`}
                      className={`robot-route ${robot.id === selectedRobotId ? "robot-route--selected" : ""}`}
                      points={robot.route.map((point) => `${point.x},${point.y}`).join(" ")}
                    />
                  ) : null
                )
              : null}

            {showStations
              ? stations.map((station) => (
                  <g key={station.id} className={`station station--${station.type.toLowerCase()}`}>
                    <rect x={station.x} y={station.y} width={station.width ?? 110} height={station.height ?? 80} rx="10" />
                    {renderStationInterior(station)}
                    <text x={station.x + 12} y={station.y + 26}>{station.id}</text>
                    <text className="station-label" x={station.x + 12} y={station.y + 48}>{station.label}</text>
                  </g>
                ))
              : null}

            {showObstacles
              ? obstacles.map((obstacle) => (
                  <g key={obstacle.id} className={`obstacle obstacle--${obstacle.type.toLowerCase()}`}>
                    <rect x={obstacle.x} y={obstacle.y} width={obstacle.width} height={obstacle.height} rx="8" />
                    {renderObstacleInterior(obstacle)}
                    {obstacle.type !== "WALL" && obstacle.type !== "DOCK_DOOR" ? (
                      <text x={obstacle.x + 10} y={obstacle.y + 24}>{obstacle.label}</text>
                    ) : null}
                  </g>
                ))
              : null}

            {(robots.data ?? []).map((robot) => {
              const selected = robot.id === selectedRobotId;
              return (
                <g
                  key={robot.id}
                  className={`robot-marker ${selected ? "robot-marker--selected" : ""}`}
                  transform={`translate(${robot.x} ${robot.y}) rotate(${robot.heading})`}
                  onClick={() => setSelectedRobotId(robot.id)}
                  role="button"
                  tabIndex={0}
                >
                  <circle r={robot.radius + 10} className="robot-marker__halo" />
                  <circle r={robot.radius} className={`robot-marker__body robot-marker__body--${robot.state.toLowerCase()}`} filter="url(#robotShadow)" />
                  <path d={`M ${robot.radius + 12} 0 L 5 -8 L 5 8 Z`} className="robot-marker__nose" />
                  <text transform={`rotate(${-robot.heading})`} x="0" y={robot.radius + 28}>
                    {robot.id}
                  </text>
                </g>
              );
            })}

            <text className="map-scale-label" x="40" y="960">
              1000 x 1000 facility coordinates · robot position in continuous map units
            </text>
          </svg>
        </div>
      </Panel>
      <div className="stack-list">
        <Panel title="Fleet Summary" subtitle="상태 / 배터리 / 예약 셀">
          <div className="stack-list">
            {(robots.data ?? []).map((robot) => (
              <button
                key={robot.id}
                className={`data-card data-card--button ${selectedRobotId === robot.id ? "data-card--selected" : ""}`}
                onClick={() => setSelectedRobotId(robot.id)}
                type="button"
              >
                <strong>{robot.id}</strong>
                <StatusBadge tone={robot.state} label={robot.state} />
                <span>Battery {robot.battery}%</span>
                <span>Reserved {robot.reservedCells.join(", ") || "-"}</span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Auto Task Generator" subtitle="Idle 로봇에 작업을 자동 투입">
          <div className="drawer-stack">
            <div className="detail-grid">
              <span>Status</span>
              <strong>{autoTasks.data?.enabled ? "RUNNING" : "STOPPED"}</strong>
              <span>Generated</span>
              <strong>{autoTasks.data?.generatedCount ?? 0}</strong>
              <span>Idle Robots</span>
              <strong>{autoTasks.data?.idleRobots ?? 0}</strong>
              <span>Last Mission</span>
              <strong>{autoTasks.data?.lastMissionId ?? "-"}</strong>
            </div>
            <div className="drawer-actions">
              <ActionButton
                tone={autoTasks.data?.enabled ? "danger" : "primary"}
                disabled={autoTaskToggleMutation.isPending}
                onClick={() => autoTaskToggleMutation.mutate(!(autoTasks.data?.enabled ?? true))}
              >
                {autoTasks.data?.enabled ? "Stop Auto" : "Start Auto"}
              </ActionButton>
              <ActionButton tone="neutral" disabled={autoTaskRunMutation.isPending} onClick={() => autoTaskRunMutation.mutate()}>
                Generate Now
              </ActionButton>
            </div>
            <p className="state-message state-message--compact">
              {autoTasks.data?.lastGeneratedAt
                ? `마지막 자동 생성: ${new Date(autoTasks.data.lastGeneratedAt).toLocaleTimeString("ko-KR")}`
                : "가용 로봇이 생기면 자동으로 Task를 만들어 Mission에 배정합니다."}
            </p>
          </div>
        </Panel>
        <Panel title="Robot Detail Drawer" subtitle="선택 로봇 상태 / 최근 이벤트 / Quick Action">
          {selectedRobot ? (
            <div className="drawer-stack">
              <div className="detail-grid">
                <span>Robot</span>
                <strong>{selectedRobot.name}</strong>
                <span>Cell</span>
                <strong>{selectedRobot.currentCell}</strong>
                <span>Mission</span>
                <strong>{selectedRobot.missionId ?? "-"}</strong>
                <span>Target</span>
                <strong>{selectedRobot.targetCell ?? "-"}</strong>
              </div>
              <div className="drawer-actions">
                <ActionButton tone="danger" disabled={!selectedMission || overrideMutation.isPending} onClick={() => submitQuickAction("PAUSE")}>
                  Pause
                </ActionButton>
                <ActionButton disabled={!selectedMission || overrideMutation.isPending} onClick={() => submitQuickAction("RESUME")}>
                  Resume
                </ActionButton>
                <ActionButton tone="neutral" disabled={!selectedMission} onClick={() => navigate(`/missions?mission=${selectedMission?.id ?? ""}`)}>
                  Open Mission
                </ActionButton>
              </div>
              <div className="event-mini-list">
                {(robotEvents.data ?? []).slice(0, 4).map((event) => (
                  <div key={event.id}>
                    <strong>{event.type}</strong>
                    <span>{new Date(event.timestamp).toLocaleTimeString("ko-KR")}</span>
                  </div>
                ))}
                {robotEvents.data?.length === 0 ? <p className="state-message state-message--compact">최근 이벤트가 없습니다.</p> : null}
              </div>
            </div>
          ) : (
            <p className="state-message">Map에서 로봇을 선택하면 상세 Drawer가 표시됩니다.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
