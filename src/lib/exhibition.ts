/**
 * 전시 기본 정보.
 * 2단계에서 Supabase settings 테이블로 옮기기 전까지 이 파일이 원본이다.
 * 날짜·시간은 모두 한국 시간(KST, +09:00) 기준.
 */
export const EXHIBITION = {
  title: "Overload: 감정의 풍경",
  /** 전시 기간 (양 끝 포함) */
  periodStart: "2026-12-22",
  periodEnd: "2026-12-31",
  periodLabel: "2026년 12월 22일(화) ~ 12월 31일(목)",
  /** 오프닝 = 첫날 개장 시각 */
  openingAt: "2026-12-22T14:00:00+09:00",
  hoursLabel: "매일 10:00–18:00 (12월 22일은 14:00 오픈)",
  closedDates: ["2026-12-25"],
  closedLabel: "12월 25일(금) 휴관",
  admission: "무료",
  venue: "역삼1동복합문화센터 1층",
  address: "서울 강남구 역삼로7길 16",
  /** 지도 링크 (네이버 지도 검색) */
  mapUrl:
    "https://map.naver.com/p/search/" +
    encodeURIComponent("서울 강남구 역삼로7길 16"),
  /** TODO: 연락처 확정 후 입력 (기획서 미정 사항) */
  contactEmail: "",
  instagram: "",
} as const;

/** 저작권자 표기 */
export const COPYRIGHT_HOLDER = "아포리즘 Aphorism";

/** 참여 작가 (가나다순, 메인 목록 순서는 sort_order로 별도 지정) */
export const ARTIST_NAMES = [
  "김미내",
  "김태현",
  "맹욱재",
  "박하영",
  "시언",
  "이민영",
  "이철영",
  "필독",
] as const;
