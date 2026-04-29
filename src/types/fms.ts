export interface Summary {
  activeRobots: number;
  pendingTasks: number;
  activeMissions: number;
  activeAlarms: number;
}

export interface Robot {
  id: string;
  name: string;
  state: "IDLE" | "MOVING" | "WAITING_PATH" | "ERROR";
  battery: number;
  currentCell: string;
  targetCell: string | null;
  reservedCells: string[];
  missionId: string | null;
  x: number;
  y: number;
}

export interface Task {
  id: string;
  type: string;
  priority: number;
  status: string;
  source: string;
  target: string;
  memo?: string;
  createdAt: string;
}

export interface Mission {
  id: string;
  robotId: string;
  taskId: string;
  state: string;
  currentStep: string;
  progress: number;
  needsManualOverride: boolean;
}

export interface Alarm {
  id: string;
  severity: string;
  title: string;
  source: string;
  status: string;
  missionId?: string;
  robotId?: string;
  createdAt: string;
}

export interface EventItem {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface Equipment {
  id: string;
  type: string;
  state: string;
  signal: string;
  lastUpdated: string;
}

export interface MapData {
  width: number;
  height: number;
  stations: Array<{ id: string; label: string; x: number; y: number; type: string }>;
  blockedCells: string[];
}
