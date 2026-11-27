/**
 * 콘텐츠 데이터 타입.
 * 기획서 4장 "데이터 구조"를 따른다. 1단계에서는 data/sample.json,
 * 2단계부터는 Supabase의 artists.published(jsonb)가 이 형태를 가진다.
 */

/** 작품 1점. 배열 순서 = 표시 순서 */
export type Work = {
  id: string;
  /** 확대용 이미지 (긴 변 1920px) */
  image_full: string;
  /** 썸네일 (가로 600px, 원본 비율) */
  image_thumb: string;
  /** 원본 비율 계산용. 메이슨리 자리 잡기에 사용 */
  width: number;
  height: number;
  /** 필수 */
  title: string;
  /** 예: "2026", "2024–2026" */
  year?: string;
  /** 재료 */
  medium?: string;
  /** 예: "130 × 97 cm" */
  size?: string;
  /** 에디션, 소장처 등 */
  etc?: string;
  /** 여러 줄 */
  description?: string;
  /** 작품 사진 촬영자. 비우면 크레딧 생략 (기획서 이후 추가된 필드) */
  photo_credit?: string;
};

/** 작가 페이지 내용 (draft / published 공통) */
export type ArtistContent = {
  name: string;
  /** 목록 썸네일용 대표 사진 */
  profile_image: string;
  bio: string;
  /** 학력: 한 줄 = 학위 · 학교 · 전공 (출력 시 열 정렬) */
  education: EducationEntry[];
  /** 전시 경력: 한 줄 = 년도 · 전시제목 · 전시장소 · 지역 (출력: 2026  「제목」, 장소, 지역) */
  exhibitions: ExhibitionEntry[];
  website?: string;
  works: Work[];
};

/** 공개 사이트가 읽는 작가 단위 (토큰 등 비공개 값은 포함하지 않는다) */
export type PublicArtist = {
  slug: string;
  sort_order: number;
} & ArtistContent;

/** 전시 설정 (Supabase settings 1행, 기획서 4장). 날짜는 KST 기준 */
export type Settings = {
  exhibition_title: string;
  /** "2026-12-22" */
  period_start: string;
  period_end: string;
  venue: string;
  address: string;
  map_url: string;
  /** 자유 텍스트. 예: "매일 10:00–18:00 (12월 22일은 14:00 오픈)" */
  hours: string;
  /** ["2026-12-25"] */
  closed_dates: string[];
  /** ISO 8601 (timestamptz) */
  opening_at: string | null;
  admission: string;
  contact_email: string;
  instagram: string;
  intro_text: string;
  edit_deadline: string | null;
};

/** 학력 한 줄. 예: { degree: "MFA", school: "OO대학교 대학원", major: "회화" } */
export type EducationEntry = {
  degree: string;
  school: string;
  major: string;
};

/** 전시 경력 한 줄. 전시제목은 출력할 때 「」를 자동으로 붙인다 (입력에는 넣지 않음) */
export type ExhibitionEntry = {
  year: string;
  title: string;
  venue: string;
  region: string;
};
