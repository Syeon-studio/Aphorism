import sample from "../../data/sample.json";
import type { PublicArtist } from "@/types/content";

/**
 * 공개 사이트 데이터 접근 계층.
 * 1단계: data/sample.json을 읽는다.
 * 2단계: 이 파일의 내부만 Supabase(published 데이터) 조회로 바꾸고,
 *        함수 시그니처는 유지한다. (페이지 코드는 수정할 필요 없게)
 */

const artists = (sample.artists as PublicArtist[])
  .slice()
  .sort((a, b) => a.sort_order - b.sort_order);

export async function getIntroText(): Promise<string> {
  return sample.intro_text;
}

export async function getArtists(): Promise<PublicArtist[]> {
  return artists;
}

export async function getArtist(slug: string): Promise<PublicArtist | null> {
  return artists.find((a) => a.slug === slug) ?? null;
}

/** 메인 목록 순서 기준 이전/다음 작가 (양 끝은 순환) */
export async function getAdjacentArtists(slug: string) {
  const i = artists.findIndex((a) => a.slug === slug);
  if (i < 0) return { prev: null, next: null };
  const n = artists.length;
  return { prev: artists[(i - 1 + n) % n], next: artists[(i + 1) % n] };
}
