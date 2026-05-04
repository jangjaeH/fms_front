import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteJson, fetchJson, patchJson, postJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { usePersistentState } from "../hooks/usePersistentState";
import type { CreateTaskInput, MapData, Task, TaskStatus, TaskType } from "../types/fms";

const taskTypes: TaskType[] = ["MOVE", "PICK", "DROP", "GO_CHARGE"];

function validateTask(input: CreateTaskInput) {
  if (!input.source.trim()) {
    return "Source is required.";
  }
  if (input.type !== "GO_CHARGE" && !input.target?.trim()) {
    return "Target is required.";
  }
  if (input.type !== "GO_CHARGE" && input.source === input.target) {
    return "Source and target cannot be the same.";
  }
  return null;
}

export function TasksPage() {
  const queryClient = useQueryClient();
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchJson<Task[]>("/tasks") });
  const map = useQuery({ queryKey: ["map"], queryFn: () => fetchJson<MapData>("/map") });
  const [showForm, setShowForm] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = usePersistentState("tasks.selectedTaskId", "");
  const [statusFilter, setStatusFilter] = usePersistentState<TaskStatus | "ALL">("tasks.statusFilter", "ALL");
  const [typeFilter, setTypeFilter] = usePersistentState<TaskType | "ALL">("tasks.typeFilter", "ALL");
  const [search, setSearch] = usePersistentState("tasks.search", "");
  const [form, setForm] = useState<CreateTaskInput>({
    type: "MOVE",
    priority: 3,
    source: "",
    target: "",
    memo: ""
  });
  const [formError, setFormError] = useState<string | null>(null);

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => postJson<Task, CreateTaskInput>("/tasks", input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowForm(false);
      setForm({ type: "MOVE", priority: 3, source: "", target: "", memo: "" });
      setFormError(null);
    },
    onError: (error: Error) => {
      setFormError(error.message);
    }
  });

  const cancelTaskMutation = useMutation({
    mutationFn: (taskId: string) => deleteJson<Task>(`/tasks/${taskId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: Partial<Pick<Task, "priority" | "memo" | "status">> }) =>
      patchJson<Task, Partial<Pick<Task, "priority" | "memo" | "status">>>(`/tasks/${taskId}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  });

  const locationOptions = useMemo(() => {
    const stations = map.data?.stations.map((station) => station.id) ?? [];
    return Array.from(new Set([...stations, "ST-01", "ST-02", "ST-05", "ST-08"]));
  }, [map.data]);

  const filteredTasks = useMemo(() => {
    return (tasks.data ?? []).filter((task) => {
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesType = typeFilter === "ALL" || task.type === typeFilter;
      const searchText = `${task.id} ${task.type} ${task.status} ${task.source} ${task.target} ${task.memo ?? ""}`.toLowerCase();
      const matchesSearch = !search.trim() || searchText.includes(search.trim().toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [tasks.data, statusFilter, typeFilter, search]);

  const selectedTask = useMemo(
    () => (tasks.data ?? []).find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? null,
    [filteredTasks, selectedTaskId, tasks.data]
  );

  const submitTask = () => {
    const validationMessage = validateTask(form);
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }
    createTaskMutation.mutate(form);
  };

  if (tasks.isLoading) {
    return <p className="state-message">Task 목록을 불러오는 중입니다.</p>;
  }

  if (tasks.isError) {
    return (
      <p className="state-message">
        Task 데이터를 불러오지 못했습니다. <button onClick={() => void tasks.refetch()}>Retry</button>
      </p>
    );
  }

  return (
    <div className="page-grid">
      <Panel title="Task Queue" subtitle="Search, filter, and create tasks from one screen">
        <div className="toolbar">
          <Field label="Search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, source, target" />
          </Field>
          <Field label="Status">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "ALL")}>
              <option value="ALL">ALL</option>
              <option value="QUEUED">QUEUED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="RUNNING">RUNNING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </Field>
          <Field label="Type">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TaskType | "ALL")}>
              <option value="ALL">ALL</option>
              {taskTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <div className="toolbar__actions">
            <ActionButton onClick={() => setShowForm((current) => !current)}>
              {showForm ? "Close Create Form" : "Create Task"}
            </ActionButton>
          </div>
        </div>

        {showForm ? (
          <div className="form-card">
            <div className="form-grid">
              <Field label="Task Type">
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as TaskType,
                      target: event.target.value === "GO_CHARGE" ? "" : current.target
                    }))
                  }
                >
                  {taskTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: Number(event.target.value) }))}
                />
              </Field>
              <Field label="Source">
                <select value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))}>
                  <option value="">Select source</option>
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target">
                <select
                  disabled={form.type === "GO_CHARGE"}
                  value={form.target ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}
                >
                  <option value="">{form.type === "GO_CHARGE" ? "Auto assigned by server" : "Select target"}</option>
                  {locationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Memo">
                <input value={form.memo ?? ""} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} />
              </Field>
            </div>
            {formError ? <p className="error-text">{formError}</p> : null}
            <div className="toolbar__actions">
              <ActionButton onClick={submitTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? "Creating..." : "Submit Task"}
              </ActionButton>
            </div>
          </div>
        ) : null}

        {filteredTasks.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Source</th>
                <th>Target</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id} className={selectedTask?.id === task.id ? "row-selected" : ""} onClick={() => setSelectedTaskId(task.id)}>
                  <td>{task.id}</td>
                  <td>{task.type}</td>
                  <td>{task.source}</td>
                  <td>{task.target}</td>
                  <td>{task.status}</td>
                  <td>{task.priority}</td>
                  <td>
                    <ActionButton
                      tone="danger"
                      disabled={task.status === "RUNNING" || cancelTaskMutation.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        cancelTaskMutation.mutate(task.id);
                      }}
                    >
                      Cancel
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="state-message">검색 조건에 맞는 Task가 없습니다.</p>
        )}
      </Panel>
      <Panel title="Task Detail" subtitle="선택 Task 취소 / 재큐잉 / 우선순위 변경">
        {selectedTask ? (
          <div className="drawer-stack">
            <div className="detail-grid">
              <span>ID</span>
              <strong>{selectedTask.id}</strong>
              <span>Status</span>
              <strong>{selectedTask.status}</strong>
              <span>Route</span>
              <strong>
                {selectedTask.source} → {selectedTask.target}
              </strong>
              <span>Created</span>
              <strong>{new Date(selectedTask.createdAt).toLocaleString("ko-KR")}</strong>
            </div>
            <div className="form-grid">
              <Field label="Priority">
                <select
                  value={selectedTask.priority}
                  onChange={(event) =>
                    updateTaskMutation.mutate({ taskId: selectedTask.id, body: { priority: Number(event.target.value) } })
                  }
                >
                  {[5, 4, 3, 2, 1].map((priority) => (
                    <option key={priority} value={priority}>
                      P{priority}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={selectedTask.status}
                  disabled={selectedTask.status === "RUNNING"}
                  onChange={(event) =>
                    updateTaskMutation.mutate({ taskId: selectedTask.id, body: { status: event.target.value as TaskStatus } })
                  }
                >
                  <option value="QUEUED">QUEUED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </Field>
            </div>
            <ul className="spec-list">
              <li>Source and target cannot be the same.</li>
              <li>GO_CHARGE uses automatic charger target selection on the backend.</li>
              <li>Filter and selected task are restored after refresh.</li>
            </ul>
          </div>
        ) : (
          <p className="state-message">Task를 선택하면 상세 정보가 표시됩니다.</p>
        )}
      </Panel>
    </div>
  );
}
