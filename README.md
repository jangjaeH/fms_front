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
