import type { Work } from "@/types/content";

/**
 * 작품 크레딧 형식 (사이트 전체에서 이 함수만 사용한다)
 *
 *   제목(기울임꼴)
 *   년도, 재료, 크기
 *   기타 정보
 *   사진: 촬영자
 *
 * - 비어 있는 항목은 구분자째 생략한다.
 * - 한 줄 표기가 필요하면(대체 텍스트, 공유 문구 등) formatCreditLine을 쓴다.
 *   예) 김미내, 〈무제〉, 2026, 캔버스에 유채, 130 × 97 cm. 사진: 홍길동
 */

const clean = (v?: string) => (v ?? "").trim();

export type CreditParts = {
  title: string;
  /** "2026, 캔버스에 유채, 130 × 97 cm" */
  details: string;
  etc: string;
  /** "사진: 홍길동" 또는 "" */
  photo: string;
};

export function getCreditParts(work: Work): CreditParts {
  const details = [work.year, work.medium, work.size]
    .map(clean)
    .filter(Boolean)
    .join(", ");
  const photographer = clean(work.photo_credit);
  return {
    title: clean(work.title),
    details,
    etc: clean(work.etc),
    photo: photographer ? `사진: ${photographer}` : "",
  };
}

export function formatCreditLine(artistName: string, work: Work): string {
  const { title, details, etc, photo } = getCreditParts(work);
  const main = [clean(artistName), title && `〈${title}〉`, details, etc]
    .filter(Boolean)
    .join(", ");
  return photo ? `${main}. ${photo}` : main;
}
