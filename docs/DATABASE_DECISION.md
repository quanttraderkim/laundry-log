# Database Decision

## A. 결론

해커톤 MVP는 Supabase Postgres를 권장합니다. 옷, 세탁 기록, 착용 기록은 관계형 모델이 자연스럽고, Supabase는 인증과 Row Level Security까지 빠르게 붙일 수 있습니다.

## B. 선택지 비교

| 선택지 | 장점 | 리스크 | 판단 |
|---|---|---|---|
| LocalStorage | 구현이 가장 빠름 | 기기 간 동기화 불가, 데이터 유실 가능 | 화면 데모용 |
| Supabase Postgres | 인증, SQL, RLS, 무료 티어, 대시보드 제공 | 초기 스키마 설계 필요 | 권장 |
| Firebase Firestore | 실시간 동기화 강점 | 관계형 조회와 집계가 번거로움 | 공유 기능 중심이면 재검토 |
| Neon/Vercel Postgres | Next.js 배포와 궁합 좋음 | 인증/RLS를 별도 구성해야 함 | 백엔드 직접 구현 시 검토 |

## C. MVP 스키마 초안

```sql
create table clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table laundry_events (
  id uuid primary key default gen_random_uuid(),
  clothing_item_id uuid not null references clothing_items(id) on delete cascade,
  washed_at date not null,
  note text,
  created_at timestamptz not null default now()
);

create table wear_events (
  id uuid primary key default gen_random_uuid(),
  clothing_item_id uuid not null references clothing_items(id) on delete cascade,
  worn_at date not null,
  created_at timestamptz not null default now()
);
```

## D. 조회 방식

첫 화면은 `clothing_items`를 기준으로 최신 `laundry_events.washed_at`과 최근 착용 횟수를 붙여 보여줍니다. 해커톤에서는 뷰나 RPC까지 만들지 않고, 클라이언트에서 간단히 합쳐도 충분합니다.

## E. 도입 순서

1. 현재 UI를 LocalStorage 또는 mock 데이터로 완성
2. Supabase 프로젝트 생성
3. `clothing_items`, `laundry_events`, `wear_events` 생성
4. 익명/이메일 로그인 중 하나 선택
5. 사용자별 RLS 적용
