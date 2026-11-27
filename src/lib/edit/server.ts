import "server-only";
import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { referencedImagePaths, hasUnpublishedChanges } from "@/lib/content";
import { CACHE_TAGS } from "@/lib/data";
import { DEFAULT_SETTINGS } from "@/lib/exhibition";
import { getSupabase, IMAGE_BUCKET } from "@/lib/supabase/server";
import type { ArtistContent } from "@/types/content";

/**
 * 작가 편집용 서버 로직 (기획서 3장). 캐시하지 않는다 — 항상 DB 최신 값.
 * 보안 모델: 토큰 = 그 작가의 편집 권한. 링크 유출은 고려하지 않는다(기획서 3-1).
 */

export type EditableArtist = {
  id: string;
  slug: string;
  draft: ArtistContent | null;
  published: ArtistContent | null;
  published_at: string | null;
  updated_at: string;
};

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{24,128}$/;
const COLUMNS = "id, slug, draft, published, published_at, updated_at";

function db() {
  const client = getSupabase();
  if (!client) throw new EditError(503, "편집 기능이 아직 연결되지 않았습니다.");
  return client;
}

export class EditError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

export async function getArtistByToken(token: string): Promise<EditableArtist | null> {
  if (!TOKEN_FORMAT.test(token)) return null;
  const { data, error } = await db().from("artists").select(COLUMNS).eq("edit_token", token).maybeSingle();
  if (error) throw new Error(`작가 조회 실패: ${error.message}`);
  return (data as EditableArtist | null) ?? null;
}

/* ------------------------------------------------------------------ 수정 마감 */

export async function getEditDeadline(): Promise<string | null> {
  const { data, error } = await db().from("settings").select("edit_deadline").eq("id", 1).maybeSingle();
  if (error) throw new Error(`설정 조회 실패: ${error.message}`);
  return data ? (data.edit_deadline as string | null) : DEFAULT_SETTINGS.edit_deadline;
}

/** 서버 시계 기준 (기기 시계가 틀려도 안전) */
export function isPastDeadline(deadline: string | null, now = new Date()): boolean {
  return Boolean(deadline) && now.getTime() >= new Date(deadline as string).getTime();
}

export async function assertCanEdit(token: string): Promise<EditableArtist> {
  const artist = await getArtistByToken(token);
  if (!artist) throw new EditError(404, "편집 링크가 올바르지 않습니다.");
  if (isPastDeadline(await getEditDeadline())) {
    throw new EditError(423, "수정 기간이 종료되었습니다. 변경이 필요하면 관리자에게 연락해주세요.");
  }
  return artist;
}

/* ------------------------------------------------------------------ 저장 */

export type SaveResult = {
  updated_at: string;
  published_at: string | null;
  has_unpublished: boolean;
};

/**
 * 임시저장 또는 완료.
 * - baseUpdatedAt: 편집 화면을 연 시점의 updated_at. 다른 곳(다른 탭·기기)에서 먼저 저장했으면 409.
 * - publish: draft를 published로 복사, 직전 published는 published_backup으로 1개 보관, 공개 페이지 즉시 갱신.
 */
export async function saveContent(
  artist: EditableArtist,
  content: ArtistContent,
  opts: { publish: boolean; baseUpdatedAt: string },
): Promise<SaveResult> {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { draft: content, updated_at: now };
  if (opts.publish) {
    patch.published = content;
    patch.published_backup = artist.published;
    patch.published_at = now;
  }

  const { data, error } = await db()
    .from("artists")
    .update(patch)
    .eq("id", artist.id)
    .eq("updated_at", opts.baseUpdatedAt)
    .select(COLUMNS);
  if (error) throw new Error(`저장 실패: ${error.message}`);
  const row = (data as EditableArtist[] | null)?.[0];
  if (!row) {
    throw new EditError(
      409,
      "다른 곳에서 먼저 저장된 내용이 있습니다. 페이지를 새로고침한 뒤 다시 시도해주세요. (지금 입력한 내용은 새로고침하면 사라지니 따로 복사해두세요)",
    );
  }

  if (opts.publish) {
    // 데이터 캐시(태그) + 이 작가를 보여주는 페이지들을 함께 무효화해 다음 방문에 바로 반영
    revalidateTag(CACHE_TAGS.artists, { expire: 0 });
    revalidatePath("/");
    revalidatePath("/artists/[slug]", "page");
  }

  // 사용하지 않는 이미지 정리 (실패해도 저장은 성공으로 처리)
  await cleanupUnusedImages(row).catch((e) => console.error("이미지 정리 실패", e));

  return {
    updated_at: row.updated_at,
    published_at: row.published_at,
    has_unpublished: hasUnpublishedChanges(row.draft, row.published),
  };
}

/* ------------------------------------------------------------------ 이미지 */

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 리사이즈 후 파일 1개 기준 (Vercel 요청 한도 4.5MB)

function detectImageType(buf: Uint8Array): "webp" | "jpg" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  const ascii = (a: number, b: number) => String.fromCharCode(...buf.slice(a, b));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  return null;
}

/**
 * 리사이즈된 이미지(full·thumb) 업로드. 파일명에 랜덤 값을 넣어 매번 새 경로로 저장한다
 * (같은 경로 덮어쓰기는 CDN·브라우저 캐시 때문에 옛 사진이 보일 수 있음).
 * 교체 전 파일은 저장 시 cleanupUnusedImages가 지운다.
 */
export async function uploadImages(
  artist: EditableArtist,
  baseName: string,
  files: { full?: File | null; thumb: File },
): Promise<{ image_full: string; image_thumb: string }> {
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(baseName)) throw new EditError(400, "잘못된 요청입니다.");
  const rand = randomBytes(6).toString("hex");
  const result = { image_full: "", image_thumb: "" };

  for (const [kind, file] of [
    ["full", files.full],
    ["thumb", files.thumb],
  ] as const) {
    if (!file) continue;
    if (file.size > MAX_UPLOAD_BYTES) throw new EditError(413, "사진 용량이 너무 큽니다.");
    const buf = new Uint8Array(await file.arrayBuffer());
    const ext = detectImageType(buf);
    if (!ext) throw new EditError(415, "WebP 또는 JPEG 이미지만 올릴 수 있습니다.");
    const path = `${artist.id}/${baseName}_${rand}_${kind}.${ext}`;
    const { error } = await db()
      .storage.from(IMAGE_BUCKET)
      .upload(path, buf, {
        contentType: ext === "webp" ? "image/webp" : "image/jpeg",
        cacheControl: "31536000", // 경로가 매번 달라 영구 캐시 가능
        upsert: false,
      });
    if (error) throw new Error(`업로드 실패: ${error.message}`);
    result[kind === "full" ? "image_full" : "image_thumb"] = path;
  }
  return result;
}

/** 업로드 후 저장 전인 파일을 보호하기 위한 유예 시간 */
const CLEANUP_GRACE_MS = 60 * 60 * 1000;

/**
 * draft·published·published_backup 어디에서도 쓰지 않는 이 작가 폴더의 파일을 지운다.
 * 방금 올리고 아직 저장하지 않은 파일(다른 탭 등)을 지우지 않도록 1시간 이상 된 파일만.
 */
async function cleanupUnusedImages(artist: EditableArtist) {
  const client = db();
  const { data: backupRow } = await client
    .from("artists")
    .select("published_backup")
    .eq("id", artist.id)
    .maybeSingle();
  const used = referencedImagePaths(artist.draft, artist.published, backupRow?.published_backup as ArtistContent | null);

  const { data: files, error } = await client.storage.from(IMAGE_BUCKET).list(artist.id, { limit: 1000 });
  if (error) throw error;
  const cutoff = Date.now() - CLEANUP_GRACE_MS;
  const stale = (files ?? [])
    .filter((f) => f.name && !used.has(`${artist.id}/${f.name}`))
    .filter((f) => !f.created_at || new Date(f.created_at).getTime() < cutoff)
    .map((f) => `${artist.id}/${f.name}`);
  if (stale.length) {
    const { error: rmError } = await client.storage.from(IMAGE_BUCKET).remove(stale);
    if (rmError) throw rmError;
  }
}
