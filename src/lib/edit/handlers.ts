import "server-only";
import { validateContent } from "@/lib/content";
import { EditError, saveContent, uploadImages, type EditableArtist } from "@/lib/edit/server";
import { NO_STORE } from "@/lib/edit/respond";

/**
 * 저장·업로드 요청 처리 (작가 편집 API와 관리자 편집 API 공용).
 * 권한 확인(토큰·마감 또는 관리자)은 호출하는 쪽에서 끝낸 뒤 artist를 넘긴다.
 */

export async function handleSave(request: Request, artist: EditableArtist): Promise<Response> {
  const body = (await request.json().catch(() => null)) as {
    content?: unknown;
    action?: unknown;
    baseUpdatedAt?: unknown;
  } | null;
  if (!body || (body.action !== "draft" && body.action !== "publish") || typeof body.baseUpdatedAt !== "string") {
    throw new EditError(400, "잘못된 요청입니다.");
  }
  const result = validateContent(body.content, { artistId: artist.id, mode: body.action });
  if (!result.ok) throw new EditError(422, "입력 내용을 확인해주세요.", result.errors);
  const saved = await saveContent(artist, result.content, {
    publish: body.action === "publish",
    baseUpdatedAt: body.baseUpdatedAt,
  });
  return Response.json(saved, { headers: NO_STORE });
}

export async function handleUpload(request: Request, artist: EditableArtist): Promise<Response> {
  const form = await request.formData().catch(() => null);
  if (!form) throw new EditError(400, "잘못된 요청입니다.");
  const kind = form.get("kind");
  const full = form.get("full");
  const thumb = form.get("thumb");
  if (!(thumb instanceof File)) throw new EditError(400, "사진 파일이 없습니다.");

  if (kind === "profile") {
    const paths = await uploadImages(artist, "profile", { thumb });
    return Response.json({ image: paths.image_thumb }, { headers: NO_STORE });
  }
  if (kind === "work") {
    if (!(full instanceof File)) throw new EditError(400, "사진 파일이 없습니다.");
    const paths = await uploadImages(artist, String(form.get("id") ?? ""), { full, thumb });
    return Response.json(paths, { headers: NO_STORE });
  }
  throw new EditError(400, "잘못된 요청입니다.");
}
