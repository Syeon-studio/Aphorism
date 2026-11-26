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
  /** 여러 줄 자유 텍스트, 줄바꿈 그대로 표시 */
  education: string;
  /** 여러 줄 자유 텍스트, 줄바꿈 그대로 표시 */
  exhibitions: string;
  website?: string;
  works: Work[];
};

/** 공개 사이트가 읽는 작가 단위 (토큰 등 비공개 값은 포함하지 않는다) */
export type PublicArtist = {
  slug: string;
  sort_order: number;
} & ArtistContent;
