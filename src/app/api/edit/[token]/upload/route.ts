import type { NextRequest } from "next/server";
import { handleUpload } from "@/lib/edit/handlers";
import { errorResponse } from "@/lib/edit/respond";
import { assertCanEdit } from "@/lib/edit/server";

/**
 * POST /api/edit/[token]/upload (multipart) — kind: work|profile, id(작품), full, thumb
 * 브라우저에서 리사이즈된 이미지를 받아 Storage에 저장하고 경로를 돌려준다.
 * 업로드만으로는 공개되지 않는다 — 경로를 담아 임시저장/완료해야 반영된다.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/edit/[token]/upload">) {
  try {
    const { token } = await ctx.params;
    return await handleUpload(request, await assertCanEdit(token));
  } catch (e) {
    return errorResponse(e);
  }
}
