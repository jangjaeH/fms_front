# Frontend Spec Mapping

## P0 Routes

- `FMS-W01` Dashboard: `/`
- `FMS-W02` Map Monitoring: `/map`
- `FMS-W03` Task Management: `/tasks`
- `FMS-W05` Mission Board: `/missions`
- `FMS-W08` Alarm Center: `/alarms`

## P1 Routes

- `FMS-W07` Equipment Monitor: `/equipment`
- `FMS-W09` Event Log: `/events`

## Shared UX Rules Reflected

- 좌측 220px 고정 네비게이션
- 상단 연결 상태 / 활성 알람 / 운영 모드 / 사용자 노출
- REST 실패 시 fallback 데이터로 초기 화면 복구
- WebSocket 연결 상태를 전역 store로 관리
- Dashboard KPI 카드에서 Map / Task / Mission / Alarm 화면으로 drill-down
- Map에서 Robot Detail Drawer, 예약 셀/Station layer 토글, Pause/Resume quick action 제공
- Task 화면에서 검색, 상태/유형 필터, 선택 Task 상세, 우선순위/상태 변경 제공
- Mission 화면에서 상태별 Kanban board, Dispatch Rule Panel, Manual Override Queue 제공
- Alarm Center에서 severity KPI, 상태 필터, 상세 대응 패널, Mission drill-down 제공
- Event Log에서 event type/source 필터, payload preview, CSV export 제공
- Map / Task / Mission / Alarm / Event 주요 선택/필터 상태는 localStorage로 복원
