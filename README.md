# Robot Monitoring Frontend

`FMS_V1_Screen_Design_Spec`을 바탕으로 만든 React 기반 운영 콘솔 초기 골격입니다.

## 포함 범위

- Dashboard / Map / Tasks / Missions / Equipment / Alarms / Events 라우팅
- 좌측 고정 네비게이션 + 상단 연결 상태/알람 메타 영역
- 백엔드 mock API 연결 및 fallback 데이터 지원
- WebSocket 연결 상태 표시
- Vitest 기본 컴포넌트 테스트

## 실행

```bash
npm install
npm run dev
```

기본 백엔드 주소는 `http://localhost:4000`입니다.

## Docker

프로젝트 상위 폴더(`/Users/jangjaehyeok/Desktop/Codex`)에서 실행합니다.

```bash
docker compose up --build
```

- Frontend: `http://localhost:5175`
- Backend API: `http://localhost:4000`
- Task 화면에서 `Create Mission`으로 작업을 넣으면 백엔드가 가용 로봇을 배정하고 Mission Board / Map에 반영합니다.
- Map 화면의 `Auto Task Generator` 패널에서 idle 로봇용 자동 Task 생성을 켜고 끄거나 즉시 생성할 수 있습니다.
