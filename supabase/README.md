# Supabase 설정 (2단계)

키·토큰 값은 이 저장소(Public)에 절대 적지 않는다. Vercel 환경변수와 로컬 `.env.local`에만 둔다.

## 1. 프로젝트 만들기

1. https://supabase.com 에서 새 프로젝트 생성 (Region: Northeast Asia (Seoul) 권장)
2. DB 비밀번호는 비밀번호 관리자에 보관 (앱에서는 쓰지 않음)

## 2. 테이블·버킷 만들기

대시보드 → **SQL Editor** → New query 에서 순서대로 붙여넣고 Run:

1. `supabase/migrations/0001_init.sql` — settings·artists 테이블, RLS(외부 차단), images 버킷
   - 2026-11-27 이전에 0001을 실행했다면 `0002_grant_service_role.sql`도 실행
2. `supabase/seed.sql` — 전시 설정 1행 + 작가 8명 더미 데이터 (작가별 편집 토큰은 DB가 랜덤 생성)

둘 다 여러 번 실행해도 안전하다. seed는 작가 내용을 더미로 되돌리므로 실제 내용이 들어간 뒤에는 실행하지 말 것.

## 3. 키 확인

대시보드 → **Project Settings → API Keys** (또는 Data API)

| 값 | 환경변수 | 비고 |
| --- | --- | --- |
| Project URL (`https://xxxx.supabase.co`) | `SUPABASE_URL` | |
| `service_role` 키 (또는 `sb_secret_...` secret key) | `SUPABASE_SERVICE_ROLE_KEY` | **서버 전용. 절대 공개 금지** |

`anon`/publishable 키는 이 프로젝트에서 쓰지 않는다.

## 4. Vercel 환경변수

Vercel 프로젝트 → Settings → Environment Variables 에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` 추가
(Production·Preview 모두). `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 추가 후 Redeploy.

환경변수가 없으면 사이트는 `data/sample.json`으로 동작한다 (로컬 개발용).

## 5. 관리자 화면 (4단계)

1. 관리자 토큰 만들기 (24자 이상 랜덤). 예: 비밀번호 관리자에서 32자 영문·숫자 비밀번호 생성
2. Vercel 환경변수에 `ADMIN_TOKEN` 추가 → 최신 커밋으로 재배포
3. 관리자 화면: `https://(사이트 주소)/admin/(ADMIN_TOKEN)` — 북마크해두고 공유하지 말 것
4. 토큰이 틀리면 404가 뜬다. 유출이 의심되면 `ADMIN_TOKEN` 값을 바꾸고 재배포

## 문제 해결

- 빌드 오류 `permission denied for table artists`
  1. `SUPABASE_SERVICE_ROLE_KEY`가 **Secret key**(`sb_secret_...` 또는 `service_role`)인지 확인.
     publishable(`sb_publishable_...`)·anon 키면 이 오류가 난다.
  2. `0002_grant_service_role.sql` 실행.
- 빌드 오류 `Invalid path specified in request URL` → `SUPABASE_URL`은 `https://xxxx.supabase.co`까지만.
- 환경변수를 고친 뒤에는 Vercel에서 **최신 커밋으로** 다시 배포해야 반영된다.

## 동작 메모

- 공개 사이트는 `artists.published`가 있는 작가만 보여준다 (`published = null`이면 숨김).
- 공개 데이터는 캐시된다. 3·4단계의 "완료"·설정 저장 시 즉시 갱신되고, 그 외(대시보드에서 직접 수정 등)는 최대 1시간 뒤 반영된다.
- 편집 토큰 확인: SQL Editor에서 `select slug, edit_token from artists order by sort_order;` (4단계 관리자 화면에서도 확인 가능 예정). 결과를 저장소·채팅방에 붙여넣지 말 것.
