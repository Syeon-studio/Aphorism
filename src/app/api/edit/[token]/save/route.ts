import type { NextRequest } from "next/server";
import { validateContent } from "@/lib/content";
import { assertCanEdit, EditError, saveContent } from "@/lib/edit/server";
import { errorResponse, NO_STORE } from "@/lib/edit/respond";

/**
 * POST /api/edit/[token]/save
 * body: { content, action: "draft" | "publish", baseUpdatedAt }
 * 브라우저는 DB에 직접 쓰지 않는다. 여기서 토큰↔작가·마감·내용을 확인한 뒤 저장한다.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/edit/[token]/save">) {
  try {
    const { token } = await ctx.params;
    const body = (await request.json().catch(() => null)) as {
      content?: unknown;
      action?: unknown;
      baseUpdatedAt?: unknown;
    } | null;
    if (!body || (body.action !== "draft" && body.action !== "publish") || typeof body.baseUpdatedAt !== "string") {
      throw new EditError(400, "잘못된 요청입니다.");
    }

    const artist = await assertCanEdit(token);
    const result = validateContent(body.content, { artistId: artist.id, mode: body.action });
    if (!result.ok) throw new EditError(422, "입력 내용을 확인해주세요.", result.errors);

    const saved = await saveContent(artist, result.content, {
      publish: body.action === "publish",
      baseUpdatedAt: body.baseUpdatedAt,
    });
    return Response.json(saved, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
