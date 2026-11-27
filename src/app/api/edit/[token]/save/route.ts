import type { NextRequest } from "next/server";
import { handleSave } from "@/lib/edit/handlers";
import { errorResponse } from "@/lib/edit/respond";
import { assertCanEdit } from "@/lib/edit/server";

/**
 * POST /api/edit/[token]/save — body: { content, action: "draft" | "publish", baseUpdatedAt }
 * 브라우저는 DB에 직접 쓰지 않는다. 토큰↔작가·마감(서버 시계)·내용을 확인한 뒤 저장한다.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/edit/[token]/save">) {
  try {
    const { token } = await ctx.params;
    return await handleSave(request, await assertCanEdit(token));
  } catch (e) {
    return errorResponse(e);
  }
}
