import { cacheLife, cacheTag } from "next/cache";
import sample from "../../data/sample.json";
import { coerceContent } from "@/lib/content";
import { DEFAULT_SETTINGS } from "@/lib/exhibition";
import { getSupabase, imageUrl } from "@/lib/supabase/server";
import type { ArtistContent, PublicArtist, Settings } from "@/types/content";

/**
 * 공개 사이트 데이터 접근 계층.
 * - SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY가 있으면 Supabase의 published 데이터를 읽는다.
 * - 없으면 data/sample.json + DEFAULT_SETTINGS (로컬 개발용).
 *
 * 캐시: 'use cache' + 태그. 작가가 "완료"하거나 관리자가 설정을 바꾸면
 * revalidateTag(CACHE_TAGS.xxx, "max")로 갱신한다 (3·4단계).
 * 태그를 놓쳐도 1시간마다 자동 갱신된다 (cacheLife "hours").
 *
 * 공개 사이트에는 edit_token·draft를 절대 넘기지 않는다 (select 컬럼 제한).
 */
export const CACHE_TAGS = {
  settings: "settings",
  artists: "artists",
} as const;

/* ------------------------------------------------------------------ settings */

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.settings);

  const db = getSupabase();
  if (!db) return { ...DEFAULT_SETTINGS, intro_text: sample.intro_text };

  const { data, error } = await db
    .from("settings")
    .select(
      "exhibition_title, period_start, period_end, venue, address, map_url, hours, closed_dates, opening_at, admission, contact_email, instagram, intro_text, edit_deadline",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`settings 조회 실패: ${error.message}`);
  // 행이 아직 없으면 기본값으로 표시 (seed.sql 실행 전)
  return data ?? { ...DEFAULT_SETTINGS, intro_text: "" };
}

/* ------------------------------------------------------------------ artists */

function withImageUrls(raw: ArtistContent): ArtistContent {
  const content = coerceContent(raw);
  return {
    ...content,
    profile_image: imageUrl(content.profile_image),
    works: (content.works ?? []).map((w) => ({
      ...w,
      image_full: imageUrl(w.image_full),
      image_thumb: imageUrl(w.image_thumb),
    })),
  };
}

/** 공개된(published가 있는) 작가 전체, 메인 목록 순서 */
export async function getArtists(): Promise<PublicArtist[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.artists);

  const db = getSupabase();
  if (!db) {
    return (sample.artists as unknown as PublicArtist[])
      .map((a) => ({ ...a, ...coerceContent(a) }))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await db
    .from("artists")
    .select("slug, sort_order, published")
    .not("published", "is", null)
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });
  if (error) throw new Error(`artists 조회 실패: ${error.message}`);

  return (data ?? []).map((row) => ({
    slug: row.slug as string,
    sort_order: row.sort_order as number,
    ...withImageUrls(row.published as ArtistContent),
  }));
}

export async function getArtist(slug: string): Promise<PublicArtist | null> {
  const artists = await getArtists();
  return artists.find((a) => a.slug === slug) ?? null;
}

/** 메인 목록 순서 기준 이전/다음 작가 (양 끝은 순환) */
export async function getAdjacentArtists(slug: string) {
  const artists = await getArtists();
  const i = artists.findIndex((a) => a.slug === slug);
  if (i < 0 || artists.length < 2) return { prev: null, next: null };
  const n = artists.length;
  return { prev: artists[(i - 1 + n) % n], next: artists[(i + 1) % n] };
}
