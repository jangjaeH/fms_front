import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppShell } from "./components/AppShell";
import { useRealtimeStatus } from "./hooks/useRealtimeStatus";
import { AlarmsPage } from "./pages/AlarmsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { EventsPage } from "./pages/EventsPage";
import { MapPage } from "./pages/MapPage";
import { MissionsPage } from "./pages/MissionsPage";
import { TasksPage } from "./pages/TasksPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <ShellWithRealtime />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "map", element: <MapPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "missions", element: <MissionsPage /> },
      { path: "equipment", element: <EquipmentPage /> },
      { path: "alarms", element: <AlarmsPage /> },
      { path: "events", element: <EventsPage /> }
    ]
  }
]);

const queryClient = new QueryClient();

function ShellWithRealtime() {
  useRealtimeStatus();
  return <AppShell />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
