import type { Settings } from "@/types/content";

/** 저작권자 표기 */
export const COPYRIGHT_HOLDER = "아포리즘 Aphorism";

/**
 * 전시 설정 기본값.
 * - DB(settings 테이블)가 연결되지 않았을 때(로컬 개발, 1단계) 사용한다.
 * - supabase/seed.sql의 settings 행도 이 값으로 생성된다 (scripts/generate-seed-sql.mjs).
 * DB가 연결되면 DB 값이 원본이다. 수정은 4단계 관리자 화면에서.
 */
export const DEFAULT_SETTINGS: Omit<Settings, "intro_text"> = {
  exhibition_title: "Overload: 감정의 풍경",
  period_start: "2026-12-22",
  period_end: "2026-12-31",
  venue: "역삼1동복합문화센터 1층",
  address: "서울 강남구 역삼로7길 16",
  map_url:
    "https://map.naver.com/p/search/" + encodeURIComponent("서울 강남구 역삼로7길 16"),
  hours: "매일 10:00–18:00 (12월 22일은 14:00 오픈)",
  closed_dates: ["2026-12-25"],
  opening_at: "2026-12-22T14:00:00+09:00",
  admission: "무료",
  // TODO: 연락처 확정 후 입력 (기획서 미정 사항)
  contact_email: "",
  instagram: "",
  // TODO: 수정 마감 확정 후 입력 (예: 2026-12-21T18:00:00+09:00)
  edit_deadline: null,
};
