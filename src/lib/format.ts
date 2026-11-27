import type { Settings } from "@/types/content";

/**
 * 날짜 표시 형식. 모든 날짜·시간은 한국 시간(Asia/Seoul) 기준으로 표시한다.
 * (서버가 UTC인 Vercel에서도 같은 결과가 나오도록 timeZone을 항상 지정)
 */
const TZ = "Asia/Seoul";

/** "2026-12-22" → 그 날 KST 정오 (요일 계산용, 시간대 경계 문제 회피) */
function dateOnly(d: string): Date {
  return new Date(`${d}T12:00:00+09:00`);
}

function parts(date: Date) {
  const f = new Intl.DateTimeFormat("ko-KR", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const get = (type: string) => f.formatToParts(date).find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    weekday: get("weekday"),
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** "12월 25일(금)" (withYear면 "2026년 12월 25일(금)") */
export function formatDay(d: string | Date, withYear = false): string {
  const p = parts(typeof d === "string" ? dateOnly(d) : d);
  return `${withYear ? `${p.year}년 ` : ""}${p.month}월 ${p.day}일(${p.weekday})`;
}

/** "2026년 12월 22일(화) ~ 12월 31일(목)" (연도가 다르면 양쪽 모두 연도 표기) */
export function formatPeriod(s: Pick<Settings, "period_start" | "period_end">): string {
  const sameYear = s.period_start.slice(0, 4) === s.period_end.slice(0, 4);
  return `${formatDay(s.period_start, true)} ~ ${formatDay(s.period_end, !sameYear)}`;
}

/** "12월 25일(금) 휴관" / 여러 날이면 쉼표로 연결, 없으면 "" */
export function formatClosed(s: Pick<Settings, "closed_dates">): string {
  if (s.closed_dates.length === 0) return "";
  return `${s.closed_dates.map((d) => formatDay(d)).join(", ")} 휴관`;
}

/** "2026년 12월 22일(화) 14:00", 없으면 "" */
export function formatDateTime(iso: string | null, withYear = true): string {
  if (!iso) return "";
  const date = new Date(iso);
  return `${formatDay(date, withYear)} ${parts(date).time}`;
}

/** "12/03 14:20" (편집 화면 상태 표시용) */
export function formatShort(iso: string | null): string {
  if (!iso) return "";
  const p = parts(new Date(iso));
  return `${p.month.padStart(2, "0")}/${p.day.padStart(2, "0")} ${p.time}`;
}
