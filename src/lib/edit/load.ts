import "server-only";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { EMPTY_CONTENT, hasUnpublishedChanges } from "@/lib/content";
import { getArtistByToken, getEditDeadline, isPastDeadline } from "@/lib/edit/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/** 편집·미리보기 페이지 공통: 토큰으로 작가를 찾는다. 항상 요청 시점의 최신 DB 값. */
export async function loadEditable(token: string) {
  await connection(); // 캐시·사전 렌더링하지 않음
  if (!isSupabaseConfigured()) return null;
  const artist = await getArtistByToken(token);
  if (!artist) notFound();
  const deadline = await getEditDeadline();
  const content = artist.draft ?? artist.published ?? EMPTY_CONTENT;
  return {
    artist,
    content,
    deadline,
    closed: isPastDeadline(deadline),
    hasUnpublished: hasUnpublishedChanges(artist.draft, artist.published),
  };
}
