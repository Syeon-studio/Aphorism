import type { NextRequest } from "next/server";
import { assertCanEdit, EditError, uploadImages } from "@/lib/edit/server";
import { errorResponse, NO_STORE } from "@/lib/edit/respond";

/**
 * POST /api/edit/[token]/upload (multipart/form-data)
 * - kind: "work" | "profile"
 * - id: 작품 ID (kind=work)
 * - full: 확대용 이미지 (kind=work), thumb: 썸네일
 * 이미지는 브라우저에서 이미 리사이즈·WebP 변환된 상태로 온다.
 * 업로드만으로는 공개되지 않는다 — 반환된 경로를 담아 임시저장/완료해야 반영된다.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/edit/[token]/upload">) {
  try {
    const { token } = await ctx.params;
    const artist = await assertCanEdit(token);
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
      const id = String(form.get("id") ?? "");
      if (!(full instanceof File)) throw new EditError(400, "사진 파일이 없습니다.");
      const paths = await uploadImages(artist, id, { full, thumb });
      return Response.json(paths, { headers: NO_STORE });
    }
    throw new EditError(400, "잘못된 요청입니다.");
  } catch (e) {
    return errorResponse(e);
  }
}
