import type { Alarm, Equipment, EventItem, MapData, Mission, Robot, Summary, Task } from "../types/fms";

export const summaryFallback: Summary = {
  activeRobots: 3,
  pendingTasks: 3,
  activeMissions: 2,
  activeAlarms: 2
};

export const robotsFallback: Robot[] = [
  {
    id: "R-01",
    name: "Atlas-01",
    state: "MOVING",
    battery: 82,
    currentCell: "C3",
    targetCell: "D5",
    reservedCells: ["D4", "D5"],
    missionId: "M-1001",
    x: 3,
    y: 3
  },
  {
    id: "R-02",
    name: "Atlas-02",
    state: "WAITING_PATH",
    battery: 64,
    currentCell: "F4",
    targetCell: "F7",
    reservedCells: ["F5", "F6", "F7"],
    missionId: "M-1002",
    x: 6,
    y: 4
  }
];

export const tasksFallback: Task[] = [
  {
    id: "T-1001",
    type: "PICK",
    priority: 5,
    status: "ASSIGNED",
    source: "PICK-01",
    target: "DROP-02",
    createdAt: "2026-04-29T08:10:00.000Z"
  },
  {
    id: "T-1002",
    type: "MOVE",
    priority: 4,
    status: "RUNNING",
    source: "ST-01",
    target: "ST-08",
    createdAt: "2026-04-29T08:12:00.000Z"
  }
];

export const missionsFallback: Mission[] = [
  {
    id: "M-1001",
    robotId: "R-01",
    taskId: "T-1001",
    state: "RUNNING",
    currentStep: "MOVE_TO_DROP",
    progress: 72,
    needsManualOverride: false
  },
  {
    id: "M-1002",
    robotId: "R-02",
    taskId: "T-1002",
    state: "PAUSED",
    currentStep: "WAIT_FOR_PATH",
    progress: 45,
    needsManualOverride: true
  }
];

export const alarmsFallback: Alarm[] = [
  {
    id: "A-1001",
    severity: "CRITICAL",
    title: "Robot wait timeout",
    source: "traffic-controller",
    status: "OPEN",
    missionId: "M-1002",
    robotId: "R-02",
    createdAt: "2026-04-29T08:25:00.000Z"
  }
];

export const eventsFallback: EventItem[] = [
  {
    id: "E-1001",
    type: "robot.position",
    source: "R-01",
    timestamp: "2026-04-29T08:26:00.000Z",
    payload: { x: 3, y: 3, cell: "C3" }
  }
];

export const equipmentFallback: Equipment[] = [
  {
    id: "EQ-01",
    type: "PICK",
    state: "READY",
    signal: "AUTO_READY",
    lastUpdated: "2026-04-29T08:20:00.000Z"
  },
  {
    id: "EQ-03",
    type: "CHARGER",
    state: "FAULT",
    signal: "EMERGENCY_STOP",
    lastUpdated: "2026-04-29T08:23:00.000Z"
  }
];

export const mapFallback: MapData = {
  width: 12,
  height: 8,
  stations: [
    { id: "PICK-01", label: "Pick 01", x: 2, y: 1, type: "PICK" },
    { id: "DROP-02", label: "Drop 02", x: 10, y: 6, type: "DROP" },
    { id: "CH-01", label: "Charge 01", x: 1, y: 7, type: "CHARGER" }
  ],
  blockedCells: ["E3", "E4"]
};
