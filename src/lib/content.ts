import type { ArtistContent, Work } from "@/types/content";

/**
 * 작가 콘텐츠 검증·정리 (서버·브라우저 공용, 서버 판단이 최종).
 * - draft(임시저장): 형식·길이만 확인. 빈 칸 허용.
 * - publish(완료): 추가로 필수 항목 확인 (작가명, 작품마다 사진·제목).
 * 알 수 없는 필드는 버린다. 문자열은 앞뒤 공백 제거.
 */

export const LIMITS = {
  name: 50,
  bio: 3000,
  education: 3000,
  exhibitions: 6000,
  website: 300,
  works: 40,
  title: 200,
  line: 200, // 년도·재료·크기·기타·촬영자 (한 줄 항목)
  description: 3000,
  imagePath: 300,
} as const;

export type ValidationMode = "draft" | "publish";

export type ValidationResult =
  | { ok: true; content: ArtistContent }
  | { ok: false; errors: string[] };

const WORK_ID = /^[A-Za-z0-9_-]{1,40}$/;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
}

/**
 * 이미지 경로는 이 작가 폴더("{artistId}/...") 또는 더미("/sample/...")만 허용.
 * 다른 작가의 파일이나 외부 URL을 끼워 넣지 못하게 한다.
 */
export function isAllowedImagePath(path: string, artistId: string): boolean {
  if (!path) return true; // 비어 있음 = 사진 없음
  if (path.length > LIMITS.imagePath) return false;
  if (path.includes("..") || path.includes("//")) return false;
  if (path.startsWith("/sample/")) return /^\/sample\/[a-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(path);
  return new RegExp(`^${artistId}/[A-Za-z0-9_-]+\\.(webp|jpg)$`).test(path);
}

export function validateContent(
  input: unknown,
  opts: { artistId: string; mode: ValidationMode },
): ValidationResult {
  const errors: string[] = [];
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;

  const tooLong = (label: string, v: string, max: number) => {
    if (v.length > max) errors.push(`${label}은(는) ${max}자 이내로 입력해주세요.`);
  };

  const name = str(src.name);
  const bio = str(src.bio);
  const education = str(src.education);
  const exhibitions = str(src.exhibitions);
  const website = str(src.website);
  const profile_image = str(src.profile_image);

  tooLong("작가명", name, LIMITS.name);
  tooLong("소개글", bio, LIMITS.bio);
  tooLong("학력", education, LIMITS.education);
  tooLong("전시 경력", exhibitions, LIMITS.exhibitions);
  tooLong("웹사이트", website, LIMITS.website);
  if (website && !/^https?:\/\/[^\s]+$/i.test(website)) {
    errors.push("웹사이트 주소는 http:// 또는 https://로 시작해야 합니다.");
  }
  if (!isAllowedImagePath(profile_image, opts.artistId)) errors.push("대표 사진 경로가 올바르지 않습니다.");
  if (opts.mode === "publish" && !name) errors.push("작가명을 입력해주세요.");

  const rawWorks = Array.isArray(src.works) ? src.works : [];
  if (rawWorks.length > LIMITS.works) errors.push(`작품은 ${LIMITS.works}점까지 등록할 수 있습니다.`);

  const seen = new Set<string>();
  const works: Work[] = rawWorks.slice(0, LIMITS.works).map((raw, i) => {
    const w = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const n = i + 1;
    const id = str(w.id);
    if (!WORK_ID.test(id) || seen.has(id)) errors.push(`${n}번째 작품의 ID가 올바르지 않습니다.`);
    seen.add(id);

    const work: Work = {
      id,
      image_full: str(w.image_full),
      image_thumb: str(w.image_thumb),
      width: num(w.width),
      height: num(w.height),
      title: str(w.title),
      year: str(w.year),
      medium: str(w.medium),
      size: str(w.size),
      etc: str(w.etc),
      description: str(w.description),
      photo_credit: str(w.photo_credit),
    };

    tooLong(`${n}번째 작품 제목`, work.title, LIMITS.title);
    for (const [label, v] of [
      ["년도", work.year],
      ["재료", work.medium],
      ["크기", work.size],
      ["기타 정보", work.etc],
      ["사진 촬영자", work.photo_credit],
    ] as const) {
      tooLong(`${n}번째 작품 ${label}`, v ?? "", LIMITS.line);
    }
    tooLong(`${n}번째 작품 설명`, work.description ?? "", LIMITS.description);

    const hasImage = Boolean(work.image_full && work.image_thumb);
    if (!isAllowedImagePath(work.image_full, opts.artistId) || !isAllowedImagePath(work.image_thumb, opts.artistId)) {
      errors.push(`${n}번째 작품의 사진 경로가 올바르지 않습니다.`);
    }
    if (hasImage && (!work.width || !work.height)) errors.push(`${n}번째 작품의 사진 크기 정보가 없습니다.`);

    if (opts.mode === "publish") {
      if (!hasImage) errors.push(`${n}번째 작품의 사진을 올려주세요.`);
      if (!work.title) errors.push(`${n}번째 작품의 제목을 입력해주세요.`);
    }
    return work;
  });

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    content: { name, profile_image, bio, education, exhibitions, website, works },
  };
}

/** 키 순서와 무관한 비교용 직렬화 */
export function stableStringify(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

/** draft와 published가 다르면 "미공개 변경 있음" */
export function hasUnpublishedChanges(draft: unknown, published: unknown): boolean {
  if (!draft) return false;
  return stableStringify(draft) !== stableStringify(published ?? null);
}

/** 콘텐츠가 참조하는 Storage 경로 모음 (더미 /sample/ 제외) */
export function referencedImagePaths(...contents: (ArtistContent | null | undefined)[]): Set<string> {
  const set = new Set<string>();
  for (const c of contents) {
    if (!c) continue;
    for (const p of [c.profile_image, ...(c.works ?? []).flatMap((w) => [w.image_full, w.image_thumb])]) {
      if (p && !p.startsWith("/")) set.add(p);
    }
  }
  return set;
}

export const EMPTY_CONTENT: ArtistContent = {
  name: "",
  profile_image: "",
  bio: "",
  education: "",
  exhibitions: "",
  website: "",
  works: [],
};
