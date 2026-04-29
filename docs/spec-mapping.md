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
