import "server-only";
import { EditError } from "@/lib/edit/server";

/** API 오류 응답 (작가에게 보여줄 한국어 메시지). 예상 못 한 오류는 내용을 숨긴다. */
export function errorResponse(e: unknown): Response {
  if (e instanceof EditError) {
    return Response.json({ error: e.message, details: e.details ?? [] }, { status: e.status });
  }
  console.error(e);
  return Response.json(
    { error: "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.", details: [] },
    { status: 500 },
  );
}

export const NO_STORE = { "Cache-Control": "no-store" };
