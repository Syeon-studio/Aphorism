import type { NextRequest } from "next/server";
import {
  assertAdmin,
  createArtist,
  deleteArtist,
  regenerateToken,
  reorderArtists,
  restoreBackup,
  saveSettings,
  unpublish,
  updateSlug,
} from "@/lib/admin/server";
import { errorResponse, NO_STORE } from "@/lib/edit/respond";
import { EditError } from "@/lib/edit/server";
import { validateSettings } from "@/lib/settings-validate";

/**
 * POST /api/admin/[adminToken] — body: { action, ...인자 }
 * settings.save | artist.create | artist.delete | artists.reorder | artist.slug | artist.token | artist.restore | artist.unpublish
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/[adminToken]">) {
  try {
    const { adminToken } = await ctx.params;
    assertAdmin(adminToken);
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body.action !== "string") throw new EditError(400, "잘못된 요청입니다.");
    const id = typeof body.id === "string" ? body.id : "";

    switch (body.action) {
      case "settings.save": {
        const r = validateSettings(body.settings);
        if (!r.ok) throw new EditError(422, "입력 내용을 확인해주세요.", r.errors);
        await saveSettings(r.settings);
        break;
      }
      case "artist.create":
        await createArtist(String(body.name ?? ""), String(body.slug ?? ""));
        break;
      case "artist.delete":
        await deleteArtist(id);
        break;
      case "artists.reorder":
        if (!Array.isArray(body.ids) || body.ids.some((x) => typeof x !== "string")) throw new EditError(400, "잘못된 요청입니다.");
        await reorderArtists(body.ids as string[]);
        break;
      case "artist.slug":
        await updateSlug(id, String(body.slug ?? ""));
        break;
      case "artist.token":
        await regenerateToken(id);
        break;
      case "artist.restore":
        await restoreBackup(id);
        break;
      case "artist.unpublish":
        await unpublish(id);
        break;
      default:
        throw new EditError(400, "잘못된 요청입니다.");
    }
    return Response.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
