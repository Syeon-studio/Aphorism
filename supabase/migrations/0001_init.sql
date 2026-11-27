-- 《Overload: 감정의 풍경》 초기 스키마 (기획서 4장)
-- Supabase 대시보드 > SQL Editor에 붙여넣고 실행한다. 여러 번 실행해도 안전하다.
--
-- 보안 메모
-- - 앱은 서버에서 service role key로만 접근한다 (service role은 RLS를 우회).
-- - RLS를 켜고 정책을 하나도 만들지 않는다 → anon/authenticated 키로는 읽기·쓰기 모두 불가.
--   (RLS를 끄면 공개 anon key만으로 edit_token까지 읽힐 수 있다)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- settings (1행)
create table if not exists public.settings (
  id               smallint primary key default 1 check (id = 1),
  exhibition_title text        not null,
  period_start     date        not null,
  period_end       date        not null,
  venue            text        not null,
  address          text        not null,
  map_url          text        not null default '',
  hours            text        not null default '',
  closed_dates     date[]      not null default '{}',
  opening_at       timestamptz,
  admission        text        not null default '무료',
  contact_email    text        not null default '',
  instagram        text        not null default '',
  intro_text       text        not null default '',
  edit_deadline    timestamptz,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------- artists
create table if not exists public.artists (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- 24자 이상 랜덤 (기본값: 32자 URL-safe)
  edit_token       text not null unique
                   default translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_')
                   check (char_length(edit_token) >= 24),
  sort_order       integer not null default 0,
  draft            jsonb,
  published        jsonb,
  published_backup jsonb,
  published_at     timestamptz,
  updated_at       timestamptz not null default now()
);

create index if not exists artists_sort_order_idx on public.artists (sort_order);

-- ---------------------------------------------------------------- RLS: 정책 없음 = 외부 차단
alter table public.settings enable row level security;
alter table public.artists  enable row level security;
revoke all on public.settings from anon, authenticated;
revoke all on public.artists  from anon, authenticated;
-- 서버(service role)에는 명시적으로 부여 (자동 부여되지 않는 프로젝트 대비)
grant usage on schema public to service_role;
grant select, insert, update, delete on public.settings, public.artists to service_role;

-- ---------------------------------------------------------------- Storage: 이미지 버킷
-- 공개 읽기(공개 사이트에서 바로 표시), 쓰기는 service role(서버)만.
-- 경로: images/{artist_id}/{work_id}_full.webp, _thumb.webp
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 10485760, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
