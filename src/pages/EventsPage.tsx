import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { apiUrl, fetchJson } from "../api/client";
import { ActionButton } from "../components/ActionButton";
import { Field } from "../components/Field";
import { Panel } from "../components/Panel";
import { usePersistentState } from "../hooks/usePersistentState";
import type { EventItem } from "../types/fms";

export function EventsPage() {
  const events = useQuery({ queryKey: ["events"], queryFn: () => fetchJson<EventItem[]>("/events") });
  const [typeFilter, setTypeFilter] = usePersistentState("events.typeFilter", "ALL");
  const [sourceFilter, setSourceFilter] = usePersistentState("events.sourceFilter", "");
  const [selectedEventId, setSelectedEventId] = usePersistentState("events.selectedEventId", "");
  const [copied, setCopied] = useState(false);
  const eventTypes = useMemo(() => Array.from(new Set((events.data ?? []).map((event) => event.type))).sort(), [events.data]);
  const filteredEvents = useMemo(() => {
    return (events.data ?? []).filter((event) => {
      const matchesType = typeFilter === "ALL" || event.type === typeFilter;
      const matchesSource =
        !sourceFilter.trim() ||
        `${event.source} ${JSON.stringify(event.payload)}`.toLowerCase().includes(sourceFilter.trim().toLowerCase());
      return matchesType && matchesSource;
    });
  }, [events.data, sourceFilter, typeFilter]);
  const selectedEvent = useMemo(
    () => (events.data ?? []).find((event) => event.id === selectedEventId) ?? filteredEvents[0] ?? null,
    [events.data, filteredEvents, selectedEventId]
  );

  const copyPayload = async () => {
    if (!selectedEvent) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedEvent.payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="page-grid">
      <Panel title="Event Log" subtitle="QA / 디버깅 / 원인 분석">
        <div className="toolbar">
          <Field label="Event Type">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
              <option value="ALL">ALL</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Source / Object">
            <input value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} placeholder="R-02, A-1001, mission" />
          </Field>
          <div className="toolbar__actions">
            <ActionButton tone="neutral" onClick={() => window.open(apiUrl("/events/export"), "_blank", "noopener,noreferrer")}>
              Export CSV
            </ActionButton>
          </div>
        </div>
        {events.isLoading ? <p className="state-message">Event 데이터를 불러오는 중입니다.</p> : null}
        {events.isError ? (
          <p className="state-message">
            Event 데이터를 불러오지 못했습니다. <button onClick={() => void events.refetch()}>Retry</button>
          </p>
        ) : null}
        {filteredEvents.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Source</th>
                <th>Payload Preview</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className={selectedEvent?.id === event.id ? "row-selected" : ""} onClick={() => setSelectedEventId(event.id)}>
                  <td>{new Date(event.timestamp).toLocaleString("ko-KR")}</td>
                  <td>{event.type}</td>
                  <td>{event.source}</td>
                  <td>
                    <code>{JSON.stringify(event.payload).slice(0, 96)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="state-message">검색 조건에 맞는 이벤트가 없습니다.</p>
        )}
      </Panel>
      <Panel title="Payload Preview" subtitle="선택 이벤트 raw payload">
        {selectedEvent ? (
          <div className="drawer-stack">
            <div className="detail-grid">
              <span>Type</span>
              <strong>{selectedEvent.type}</strong>
              <span>Source</span>
              <strong>{selectedEvent.source}</strong>
              <span>Timestamp</span>
              <strong>{new Date(selectedEvent.timestamp).toLocaleString("ko-KR")}</strong>
            </div>
            <pre className="payload-block">{JSON.stringify(selectedEvent.payload, null, 2)}</pre>
            <ActionButton tone="neutral" onClick={() => void copyPayload()}>
              {copied ? "Copied" : "Copy Raw Payload"}
            </ActionButton>
          </div>
        ) : (
          <p className="state-message">이벤트를 선택하면 payload가 표시됩니다.</p>
        )}
      </Panel>
    </div>
  );
}
