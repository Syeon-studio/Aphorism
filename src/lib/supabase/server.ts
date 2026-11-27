import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트 (service role key 사용 → RLS 우회).
 * 이 모듈은 브라우저 번들에 들어가면 빌드가 실패한다 ("server-only").
 * 환경변수가 없으면 null — 호출하는 쪽에서 sample.json으로 대체한다.
 */
let client: SupabaseClient | null | undefined;

/**
 * SUPABASE_URL을 "https://xxxx.supabase.co" 형태(origin)로 정규화한다.
 * 대시보드에서 복사할 때 "/rest/v1/"나 끝 "/"가 붙어 들어와도 동작하도록.
 */
export function getSupabaseUrl(): string | null {
  const raw = process.env.SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    throw new Error("SUPABASE_URL 형식이 잘못되었습니다. 예: https://xxxx.supabase.co");
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

export const IMAGE_BUCKET = "images";

/**
 * DB에 저장된 이미지 경로 → 브라우저에서 쓸 URL.
 * - "/sample/..."처럼 /로 시작하면 public/ 폴더의 로컬 파일 (1단계 더미)
 * - "http..."면 그대로
 * - 그 외는 Storage 버킷 안의 경로 ("{artist_id}/{work_id}_thumb.webp")
 */
export function imageUrl(path: string): string {
  if (!path || path.startsWith("/") || /^https?:\/\//.test(path)) return path;
  const base = getSupabaseUrl();
  return base ? `${base}/storage/v1/object/public/${IMAGE_BUCKET}/${path}` : path;
}

/** 브라우저에서 Storage 경로를 URL로 바꿀 때 쓰는 접두사 (공개 버킷이라 노출돼도 무방) */
export function imageBaseUrl(): string {
  const base = getSupabaseUrl();
  return base ? `${base}/storage/v1/object/public/${IMAGE_BUCKET}/` : "/";
}
