# WashLog

옷을 언제 빨았는지 빠르게 기록하고, 모바일 웹에서 바로 확인하는 해커톤 서비스입니다. 현재 레포는 PRD 취합 전 팀원이 같은 화면을 보며 논의할 수 있도록 Next.js 기반의 모바일 우선 프로토타입과 협업 문서를 먼저 구성했습니다.

## 현재 판단

| 항목 | 결정 |
|---|---|
| 구현 범위 | 웹 우선, 모바일 화면을 1차 기준으로 설계 |
| 프론트엔드 | Next.js App Router, TypeScript, Tailwind CSS |
| 초기 데이터 | 해커톤 데모는 브라우저 상태/LocalStorage 기준 |
| DB 권장안 | 시간이 남으면 Supabase Postgres. 인증, 관계형 데이터, RLS까지 확장 가능 |
| 레포 공개 | 해커톤 협업은 Public repo 권장. 단, API 키와 개인 데이터는 커밋 금지 |

## 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

## 문서

| 문서 | 용도 |
|---|---|
| [PRD](docs/PRD.md) | 해커톤 합의본 제품 요구사항 |
| [Photo Registration PRD](docs/prd/PHOTO_REGISTRATION_PRD.md) | 사진 기반 옷 등록 고도화 PRD |
| [Product Brief](docs/PRODUCT_BRIEF.md) | 서비스 목적, MVP, 우선순위 |
| [Database Decision](docs/DATABASE_DECISION.md) | DB 선택 기준과 초안 스키마 |
| [Collaboration Guide](CONTRIBUTING.md) | 브랜치, PR, PRD 취합 룰 |

## PRD 취합 방식

팀원 2명의 PRD는 `docs/prd/raw/`에 원문으로 넣고, 합의된 내용만 `docs/PRD.md`와 `docs/PRODUCT_BRIEF.md`에 반영합니다. 중복 설명은 한 곳에만 남기고, 판단이 필요한 내용은 `결정 필요`로 표시합니다.

## 다음 액션

1. 팀원 PRD 2개 수집
2. 공통 요구사항과 충돌 요구사항 분리
3. Supabase 프로젝트 생성 여부 결정
4. 빠른 문장 입력과 `땀남/냄새/얼룩` 칩으로 데모 완성
5. 소재별 세탁 권장 규칙을 UI와 데이터 모델에 반영
6. 인증 없이 단일 사용자 MVP를 먼저 완성한 뒤 공유/가족 단위 기능 확장
