import type { NextRequest } from "next/server";
import { assertAdmin, getArtistById } from "@/lib/admin/server";
import { handleUpload } from "@/lib/edit/handlers";
import { errorResponse } from "@/lib/edit/respond";
import { EditError } from "@/lib/edit/server";

/** 관리자가 작가 사진 업로드 (수정 마감과 무관하게 항상 허용) */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/[adminToken]/artists/[id]/upload">) {
  try {
    const { adminToken, id } = await ctx.params;
    assertAdmin(adminToken);
    const artist = await getArtistById(id);
    if (!artist) throw new EditError(404, "작가를 찾을 수 없습니다.");
    return await handleUpload(request, artist);
  } catch (e) {
    return errorResponse(e);
  }
}
