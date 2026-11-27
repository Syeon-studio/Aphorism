import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { EMPTY_CONTENT, hasUnpublishedChanges } from "@/lib/content";
import { CACHE_TAGS } from "@/lib/data";
import { EditError, type EditableArtist } from "@/lib/edit/server";
import { DEFAULT_SETTINGS } from "@/lib/exhibition";
import { SLUG_FORMAT } from "@/lib/settings-validate";
import { getSupabase, IMAGE_BUCKET } from "@/lib/supabase/server";
import type { ArtistContent, Settings } from "@/types/content";

/**
 * 관리자 기능 (기획서 3-1, 6장 4단계). 마스터 토큰 하나(ADMIN_TOKEN 환경변수).
 * 관리자 저장은 수정 마감과 무관하게 항상 허용.
 */

function db() {
  const c = getSupabase();
  if (!c) throw new EditError(503, "DB가 연결되지 않았습니다.");
  return c;
}

/** 길이와 무관하게 일정한 시간으로 비교 (토큰 추측 공격 완화) */
export function isAdminToken(token: string): boolean {
  const expected = process.env.ADMIN_TOKEN?.trim();
  if (!expected || expected.length < 24 || !token) return false;
  const a = createHash("sha256").update(token).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function assertAdmin(token: string) {
  if (!isAdminToken(token)) throw new EditError(404, "페이지를 찾을 수 없습니다.");
}

/** 공개 사이트 전체(레이아웃의 메타데이터 포함) 즉시 갱신 */
function revalidatePublic() {
  revalidateTag(CACHE_TAGS.artists, { expire: 0 });
  revalidateTag(CACHE_TAGS.settings, { expire: 0 });
  revalidatePath("/", "layout");
}

/* ------------------------------------------------------------------ 목록 */

export type AdminArtist = {
  id: string;
  slug: string;
  name: string;
  edit_token: string;
  sort_order: number;
  published_at: string | null;
  updated_at: string;
  is_published: boolean;
  has_unpublished: boolean;
  has_backup: boolean;
  work_count: number;
};

export async function listArtists(): Promise<AdminArtist[]> {
  const { data, error } = await db()
    .from("artists")
    .select("id, slug, edit_token, sort_order, draft, published, published_backup, published_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true });
  if (error) throw new Error(`작가 목록 조회 실패: ${error.message}`);
  return (data ?? []).map((r) => {
    const draft = r.draft as ArtistContent | null;
    const published = r.published as ArtistContent | null;
    return {
      id: r.id,
      slug: r.slug,
      name: draft?.name || published?.name || "(이름 없음)",
      edit_token: r.edit_token,
      sort_order: r.sort_order,
      published_at: r.published_at,
      updated_at: r.updated_at,
      is_published: Boolean(published),
      has_unpublished: hasUnpublishedChanges(draft, published),
      has_backup: Boolean(r.published_backup),
      work_count: (draft ?? published)?.works?.length ?? 0,
    };
  });
}

export async function getArtistById(id: string): Promise<EditableArtist | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data, error } = await db()
    .from("artists")
    .select("id, slug, draft, published, published_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`작가 조회 실패: ${error.message}`);
  return (data as EditableArtist | null) ?? null;
}

/* ------------------------------------------------------------------ 설정 */

export async function getSettingsFresh(): Promise<Settings> {
  const { data, error } = await db()
    .from("settings")
    .select(
      "exhibition_title, period_start, period_end, venue, address, map_url, hours, closed_dates, opening_at, admission, contact_email, instagram, intro_text, edit_deadline",
    )
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`설정 조회 실패: ${error.message}`);
  return (data as Settings | null) ?? { ...DEFAULT_SETTINGS, intro_text: "" };
}

export async function saveSettings(s: Settings) {
  const { data, error } = await db()
    .from("settings")
    .update({ ...s, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id");
  if (error) throw new Error(`설정 저장 실패: ${error.message}`);
  if (!data?.length) {
    const { error: insErr } = await db().from("settings").insert({ id: 1, ...s });
    if (insErr) throw new Error(`설정 저장 실패: ${insErr.message}`);
  }
  revalidatePublic();
}

/* ------------------------------------------------------------------ 작가 관리 */

function newToken() {
  return randomBytes(24).toString("base64url"); // 32자
}

function checkSlug(slug: string) {
  if (!SLUG_FORMAT.test(slug) || slug.length > 60) {
    throw new EditError(422, "주소는 영문 소문자·숫자·하이픈(-)만 쓸 수 있습니다. 예: kim-minae");
  }
}

function uniqueError(message: string, code?: string) {
  if (code === "23505") throw new EditError(409, "이미 쓰고 있는 주소입니다. 다른 주소를 입력해주세요.");
  throw new Error(message);
}

export async function createArtist(name: string, slug: string) {
  name = name.trim();
  slug = slug.trim().toLowerCase();
  if (!name || name.length > 50) throw new EditError(422, "작가명을 50자 이내로 입력해주세요.");
  checkSlug(slug);
  const all = await listArtists();
  const sort_order = all.reduce((m, a) => Math.max(m, a.sort_order), 0) + 1;
  const { error } = await db()
    .from("artists")
    .insert({ slug, sort_order, edit_token: newToken(), draft: { ...EMPTY_CONTENT, name } });
  if (error) uniqueError(`작가 추가 실패: ${error.message}`, error.code);
  // 공개본이 없으므로 공개 사이트에는 아직 나타나지 않는다
}

export async function deleteArtist(id: string) {
  const artist = await getArtistById(id);
  if (!artist) throw new EditError(404, "작가를 찾을 수 없습니다.");
  const { error } = await db().from("artists").delete().eq("id", id);
  if (error) throw new Error(`작가 삭제 실패: ${error.message}`);
  // 이 작가의 이미지 전부 삭제
  const { data: files } = await db().storage.from(IMAGE_BUCKET).list(id, { limit: 1000 });
  const paths = (files ?? []).map((f) => `${id}/${f.name}`);
  if (paths.length) await db().storage.from(IMAGE_BUCKET).remove(paths);
  revalidatePublic();
}

/** ids 순서대로 sort_order = 1, 2, 3… */
export async function reorderArtists(ids: string[]) {
  const existing = new Set((await listArtists()).map((a) => a.id));
  if (ids.length !== existing.size || ids.some((id) => !existing.has(id))) {
    throw new EditError(409, "작가 목록이 바뀌었습니다. 새로고침 후 다시 시도해주세요.");
  }
  for (const [i, id] of ids.entries()) {
    const { error } = await db().from("artists").update({ sort_order: i + 1 }).eq("id", id);
    if (error) throw new Error(`순서 저장 실패: ${error.message}`);
  }
  revalidatePublic();
}

export async function updateSlug(id: string, slug: string) {
  slug = slug.trim().toLowerCase();
  checkSlug(slug);
  const { data, error } = await db().from("artists").update({ slug }).eq("id", id).select("id");
  if (error) uniqueError(`주소 변경 실패: ${error.message}`, error.code);
  if (!data?.length) throw new EditError(404, "작가를 찾을 수 없습니다.");
  revalidatePublic();
}

export async function regenerateToken(id: string) {
  const { data, error } = await db().from("artists").update({ edit_token: newToken() }).eq("id", id).select("id");
  if (error) throw new Error(`토큰 재발급 실패: ${error.message}`);
  if (!data?.length) throw new EditError(404, "작가를 찾을 수 없습니다.");
}

/** 직전 공개본으로 되돌리기 (현재 공개본은 백업으로 바뀌어, 한 번 더 누르면 원래대로) */
export async function restoreBackup(id: string) {
  const { data: row, error } = await db()
    .from("artists")
    .select("published, published_backup")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`복구 실패: ${error.message}`);
  if (!row) throw new EditError(404, "작가를 찾을 수 없습니다.");
  if (!row.published_backup) throw new EditError(409, "되돌릴 이전 공개본이 없습니다.");
  const now = new Date().toISOString();
  const { error: upErr } = await db()
    .from("artists")
    .update({ published: row.published_backup, published_backup: row.published, published_at: now, updated_at: now })
    .eq("id", id);
  if (upErr) throw new Error(`복구 실패: ${upErr.message}`);
  revalidatePublic();
}

/** 공개 중단 (공개 사이트에서 숨김, 내용은 draft에 남는다) */
export async function unpublish(id: string) {
  const { data: row } = await db().from("artists").select("published, draft").eq("id", id).maybeSingle();
  if (!row) throw new EditError(404, "작가를 찾을 수 없습니다.");
  const now = new Date().toISOString();
  const { error } = await db()
    .from("artists")
    .update({ published: null, published_backup: row.published, draft: row.draft ?? row.published, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(`공개 중단 실패: ${error.message}`);
  revalidatePublic();
}
