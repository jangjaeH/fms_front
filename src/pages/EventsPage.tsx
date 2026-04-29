import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "../api/client";
import { Panel } from "../components/Panel";
import type { EventItem } from "../types/fms";

export function EventsPage() {
  const events = useQuery({ queryKey: ["events"], queryFn: () => fetchJson<EventItem[]>("/events") });

  return (
    <Panel title="Event Log" subtitle="QA / 디버깅 / 원인 분석">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Type</th>
            <th>Source</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          {(events.data ?? []).map((event) => (
            <tr key={event.id}>
              <td>{new Date(event.timestamp).toLocaleTimeString("ko-KR")}</td>
              <td>{event.type}</td>
              <td>{event.source}</td>
              <td>
                <code>{JSON.stringify(event.payload)}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
