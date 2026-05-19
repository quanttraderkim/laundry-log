# Database Decision

## A. 결론

해커톤 MVP의 데모 성공 기준은 LocalStorage입니다. 시간이 남으면 Supabase Postgres를 연결합니다. 옷, 착용, 세탁, 통풍, 드라이, 자연어 입력 원문을 모두 관계형 이벤트 로그로 남기면 첫 화면 상태 계산과 이후 확장이 단순해집니다.

| 항목 | 결정 |
|---|---|
| DB | 데모는 LocalStorage, 후속 연결은 Supabase Postgres |
| 인증 | 해커톤 데모는 인증 없음, 이후 Supabase Auth |
| 이벤트 모델 | 착용/세탁/관리 이벤트를 `clothing_events` 단일 테이블로 저장 |
| 소재별 규칙 | MVP는 코드 상수, 이후 `care_rules` 테이블화 |
| 원문 보관 | 자연어 입력은 `raw_input`에 저장해 파싱 개선 근거로 사용 |
| 상태 계산 | 세탁 기준과 통풍/스타일러 관리 기준을 분리 |

## B. 선택지 비교

| 선택지 | 장점 | 리스크 | 판단 |
|---|---|---|---|
| LocalStorage | 구현이 가장 빠름 | 기기 간 동기화 불가, 데이터 유실 가능 | 화면 데모용 |
| Supabase Postgres | 인증, SQL, RLS, 무료 티어, 대시보드 제공 | 초기 스키마 설계 필요 | 권장 |
| Firebase Firestore | 실시간 동기화 강점 | 이벤트 집계와 관계형 조회가 번거로움 | 공유 기능 중심이면 재검토 |
| Neon/Vercel Postgres | Next.js 배포와 궁합 좋음 | 인증/RLS를 별도 구성해야 함 | 백엔드 직접 구현 시 검토 |

## C. MVP 스키마 초안

```sql
create type clothing_event_type as enum (
  'worn',
  'washed',
  'aired',
  'dry_cleaned',
  'styler',
  'created',
  'updated'
);

create type care_method as enum (
  'machine',
  'hand',
  'dry_clean',
  'air',
  'styler',
  'unknown'
);

create table clothing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  category text not null,
  material text not null default 'unknown',
  care_profile text not null default 'standard',
  direct_skin boolean not null default false,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table clothing_events (
  id uuid primary key default gen_random_uuid(),
  clothing_item_id uuid not null references clothing_items(id) on delete cascade,
  event_type clothing_event_type not null,
  event_date date not null,
  care_method care_method,
  condition_flags text[] not null default '{}',
  source text not null default 'web',
  raw_input text,
  note text,
  created_at timestamptz not null default now()
);
```

## D. 상태 계산

첫 화면은 `clothing_items`를 기준으로 최신 세탁일, 최신 관리일, 세탁 이후 착용 횟수, 상태 칩을 붙여 계산합니다. 해커톤에서는 DB view 없이 클라이언트에서 계산해도 충분합니다.

| 계산값 | 기준 |
|---|---|
| `last_laundry_date` | 최신 `washed`, `dry_cleaned` 이벤트 |
| `last_maintenance_date` | 최신 `styler`, `aired` 이벤트 |
| `wears_since_laundry` | 최신 세탁 이후 `worn` 이벤트 수 |
| `condition_flags` | 최신 미해결 `sweat`, `odor`, `stain` 기록 |
| `status` | 소재/종류별 규칙과 착용 횟수, 일수, 오염 메모 기준 |
| `reason` | `땀 기록`, `소재 특성`, `착용 횟수`, `마지막 세탁일` 중 하나 |

`washed`, `dry_cleaned`는 위생 기준을 초기화합니다. `aired`, `styler`는 냄새/구김 완화 기록이므로 `last_maintenance_date`에만 반영하고 `wears_since_laundry`를 초기화하지 않습니다.

## E. 소재별 규칙 저장

MVP에서는 아래 규칙을 코드 상수로 둡니다. 운영 단계에서 사용자별 커스터마이징이 필요해지면 `care_rules` 테이블로 분리합니다.

| 프로필 | 예시 | 기본 기준 |
|---|---|---|
| `daily_skin` | 속옷, 양말, 이너웨어 | 1회 착용 후 세탁 |
| `active_synthetic` | 폴리에스터 운동복 | 1회 착용 또는 땀 기록 시 세탁 |
| `cotton_top` | 면 티셔츠 | 1~2회 착용 후 세탁 |
| `standard_outer` | 셔츠, 슬랙스 | 2~3회 착용 후 점검 |
| `denim` | 청바지, 데님 재킷 | 3회 착용 후 점검 |
| `wool_delicate` | 울, 캐시미어, 니트 | 세탁보다 통풍/부분 관리 우선 |
| `silk_white` | 실크, 흰옷 | 오염/변색 주의, 빠른 관리 |

## F. 도입 순서

1. LocalStorage로 `material`, `care_profile`, `condition_flags`, `reason` 데모 완성
2. 빠른 자연어 입력 mock 파싱 구현
3. 시간이 남으면 Supabase 프로젝트 생성
4. `clothing_items`, `clothing_events` 생성
5. 익명/이메일 로그인 중 하나 선택
6. 사용자별 RLS 적용
