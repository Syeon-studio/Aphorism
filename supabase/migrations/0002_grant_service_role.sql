-- 서버(service role)에 테이블 권한을 명시적으로 부여한다.
-- 최근 Supabase 프로젝트는 새 테이블 권한을 service_role에 자동으로 주지 않을 수 있어,
-- 이 경우 빌드가 "permission denied for table artists"로 실패한다.
-- SQL Editor에서 실행. 여러 번 실행해도 안전하다.
-- (anon/authenticated는 계속 차단: 0001에서 revoke + RLS 정책 없음)

grant usage on schema public to service_role;
grant select, insert, update, delete on public.settings to service_role;
grant select, insert, update, delete on public.artists  to service_role;
