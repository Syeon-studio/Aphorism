import type { Settings } from "@/types/content";

/**
 * 전시 설정 검증 (관리자 화면 → 서버). 날짜·시간은 KST.
 * - 날짜: "YYYY-MM-DD"
 * - 일시: ISO 8601 (관리자 화면은 "YYYY-MM-DDTHH:mm" 입력을 KST로 해석해 "+09:00"을 붙여 보낸다)
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX = { short: 100, long: 300, intro: 5000 };

function str(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}
function validDate(d: string) {
  return DATE.test(d) && !Number.isNaN(new Date(`${d}T00:00:00+09:00`).getTime());
}
function isoOrNull(v: unknown): string | null | "invalid" {
  const s = str(v);
  if (!s) return null;
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? "invalid" : t.toISOString();
}

export function validateSettings(input: unknown): { ok: true; settings: Settings } | { ok: false; errors: string[] } {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: string[] = [];
  const s = {
    exhibition_title: str(src.exhibition_title),
    period_start: str(src.period_start),
    period_end: str(src.period_end),
    venue: str(src.venue),
    address: str(src.address),
    map_url: str(src.map_url),
    hours: str(src.hours),
    admission: str(src.admission),
    contact_email: str(src.contact_email),
    instagram: str(src.instagram).replace(/^@/, ""),
    intro_text: str(src.intro_text),
  };

  if (!s.exhibition_title) errors.push("전시명을 입력해주세요.");
  if (!s.venue) errors.push("장소를 입력해주세요.");
  if (!s.address) errors.push("주소를 입력해주세요.");
  if (!validDate(s.period_start) || !validDate(s.period_end)) errors.push("전시 기간 날짜를 확인해주세요.");
  else if (s.period_start > s.period_end) errors.push("전시 시작일이 종료일보다 늦습니다.");
  for (const [label, v, max] of [
    ["전시명", s.exhibition_title, MAX.short],
    ["장소", s.venue, MAX.short],
    ["주소", s.address, MAX.short],
    ["운영시간", s.hours, MAX.long],
    ["입장료", s.admission, MAX.short],
    ["이메일", s.contact_email, MAX.short],
    ["인스타그램", s.instagram, MAX.short],
    ["지도 링크", s.map_url, 1000],
    ["서문", s.intro_text, MAX.intro],
  ] as const) {
    if (v.length > max) errors.push(`${label}은(는) ${max}자 이내로 입력해주세요.`);
  }
  if (s.map_url && !/^https:\/\/\S+$/i.test(s.map_url)) errors.push("지도 링크는 https://로 시작해야 합니다.");
  if (s.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.contact_email)) errors.push("이메일 형식을 확인해주세요.");
  if (s.instagram && !/^[A-Za-z0-9._]{1,30}$/.test(s.instagram)) errors.push("인스타그램 아이디는 영문·숫자·._만 가능합니다.");

  const rawClosed = Array.isArray(src.closed_dates) ? src.closed_dates : [];
  const closed_dates = [...new Set(rawClosed.map(str).filter(Boolean))].sort();
  if (closed_dates.some((d) => !validDate(d))) errors.push("휴관일 날짜를 확인해주세요.");
  if (closed_dates.length > 31) errors.push("휴관일이 너무 많습니다.");

  const opening_at = isoOrNull(src.opening_at);
  const edit_deadline = isoOrNull(src.edit_deadline);
  if (opening_at === "invalid") errors.push("오프닝 일시를 확인해주세요.");
  if (edit_deadline === "invalid") errors.push("수정 마감 일시를 확인해주세요.");

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    settings: {
      ...s,
      closed_dates,
      opening_at: opening_at as string | null,
      edit_deadline: edit_deadline as string | null,
    },
  };
}

/** ISO → datetime-local 입력값 "YYYY-MM-DDTHH:mm" (KST) */
export function toKstLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

/** datetime-local 입력값(KST) → ISO, 비어 있으면 null */
export function fromKstLocalInput(v: string): string | null {
  return v ? new Date(`${v}:00+09:00`).toISOString() : null;
}

export const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;
