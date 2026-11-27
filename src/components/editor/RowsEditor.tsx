"use client";

import { LIMITS } from "@/lib/content";
import type { EducationEntry, ExhibitionEntry } from "@/types/content";

/**
 * 학력·전시 경력 줄 단위 입력. 빈 줄은 저장할 때 자동으로 빠진다.
 * 모바일은 한 줄을 두 단으로, 태블릿 이상은 한 줄로 배치.
 */

const cell =
  "w-full min-w-0 rounded-lg border border-black/15 bg-white px-2.5 py-2 text-base outline-none focus:border-black focus:ring-2 focus:ring-black/10 disabled:bg-black/5";
const addBtn = "mt-2 rounded-lg border border-dashed border-black/25 px-3 py-2 text-sm font-bold hover:border-black/50 disabled:opacity-40";
const delBtn = "flex h-10 w-9 shrink-0 items-center justify-center rounded-lg text-sm opacity-40 hover:opacity-100 disabled:opacity-20";

export const EMPTY_EDUCATION: EducationEntry = { degree: "", school: "", major: "" };
export const EMPTY_EXHIBITION: ExhibitionEntry = { year: "", title: "", venue: "", region: "" };

export function EducationRows({
  rows,
  onChange,
  disabled,
}: {
  rows: EducationEntry[];
  onChange: (rows: EducationEntry[]) => void;
  disabled?: boolean;
}) {
  const update = (i: number, patch: Partial<EducationEntry>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-bold">학력</legend>
      <p className="mt-0.5 text-xs opacity-60">한 줄에 하나씩. 공개 페이지에서 학위·학교·전공이 열 맞춰 정렬됩니다.</p>
      <div className="mt-2 hidden grid-cols-[6rem_1fr_1fr_2.25rem] gap-2 px-0.5 text-xs opacity-60 tablet:grid" aria-hidden="true">
        <span>학위</span>
        <span>학교</span>
        <span>전공</span>
      </div>
      <ol className="mt-1 grid gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-[5.5rem_1fr] gap-2 tablet:grid-cols-[6rem_1fr_1fr]">
              <input className={cell} value={r.degree} onChange={(e) => update(i, { degree: e.target.value })} maxLength={LIMITS.degree} placeholder="BFA" aria-label={`학력 ${i + 1}번째 줄 학위`} />
              <input className={cell} value={r.school} onChange={(e) => update(i, { school: e.target.value })} maxLength={LIMITS.school} placeholder="학교" aria-label={`학력 ${i + 1}번째 줄 학교`} />
              <input className={`${cell} col-span-2 tablet:col-span-1`} value={r.major} onChange={(e) => update(i, { major: e.target.value })} maxLength={LIMITS.major} placeholder="전공" aria-label={`학력 ${i + 1}번째 줄 전공`} />
            </div>
            <button type="button" className={delBtn} onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`학력 ${i + 1}번째 줄 지우기`}>
              ✕
            </button>
          </li>
        ))}
      </ol>
      {rows.length < LIMITS.educationRows && (
        <button type="button" className={addBtn} onClick={() => onChange([...rows, { ...EMPTY_EDUCATION }])}>
          + 학력 추가
        </button>
      )}
    </fieldset>
  );
}

export function ExhibitionRows({
  rows,
  onChange,
  disabled,
}: {
  rows: ExhibitionEntry[];
  onChange: (rows: ExhibitionEntry[]) => void;
  disabled?: boolean;
}) {
  const update = (i: number, patch: Partial<ExhibitionEntry>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-bold">전시 경력</legend>
      <p className="mt-0.5 text-xs opacity-60">
        전시마다 한 줄씩. 전시제목에는 「」를 넣지 않아도 자동으로 붙습니다. 예: 2026 「전시제목」, 전시장, 서울
      </p>
      <div className="mt-2 hidden grid-cols-[4.5rem_2fr_1.5fr_1fr_2.25rem] gap-2 px-0.5 text-xs opacity-60 tablet:grid" aria-hidden="true">
        <span>년도</span>
        <span>전시제목</span>
        <span>전시장소</span>
        <span>지역</span>
      </div>
      <ol className="mt-1 grid gap-2">
        {rows.map((r, i) => (
          <li key={i} className="flex items-start gap-2 border-b border-black/5 pb-2 tablet:border-0 tablet:pb-0">
            {/* 모바일: 1줄 = 년도·전시제목, 2줄 = 전시장소·지역 / 태블릿 이상: 한 줄 */}
            <div className="grid min-w-0 flex-1 grid-cols-[4.5rem_1fr_6rem] gap-2 tablet:grid-cols-[4.5rem_2fr_1.5fr_1fr]">
              <input className={cell} value={r.year} onChange={(e) => update(i, { year: e.target.value })} maxLength={LIMITS.exYear} placeholder="년도" inputMode="numeric" aria-label={`전시 경력 ${i + 1}번째 줄 년도`} />
              <input className={`${cell} col-span-2 tablet:col-span-1`} value={r.title} onChange={(e) => update(i, { title: e.target.value })} maxLength={LIMITS.exTitle} placeholder="전시제목" aria-label={`전시 경력 ${i + 1}번째 줄 전시제목`} />
              <input className={`${cell} col-start-2 tablet:col-start-auto`} value={r.venue} onChange={(e) => update(i, { venue: e.target.value })} maxLength={LIMITS.exVenue} placeholder="전시장소" aria-label={`전시 경력 ${i + 1}번째 줄 전시장소`} />
              <input className={cell} value={r.region} onChange={(e) => update(i, { region: e.target.value })} maxLength={LIMITS.exRegion} placeholder="지역" aria-label={`전시 경력 ${i + 1}번째 줄 지역`} />
            </div>
            <button type="button" className={delBtn} onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label={`전시 경력 ${i + 1}번째 줄 지우기`}>
              ✕
            </button>
          </li>
        ))}
      </ol>
      {rows.length < LIMITS.exhibitionRows && (
        <button type="button" className={addBtn} onClick={() => onChange([...rows, { ...EMPTY_EXHIBITION }])}>
          + 전시 추가
        </button>
      )}
    </fieldset>
  );
}

/** 편집 화면 기본 줄 수: 학력 3줄, 전시 경력 5줄 (모자라면 빈 줄로 채움) */
export function padRows<T>(list: T[], min: number, empty: T): T[] {
  return list.length >= min ? list : [...list, ...Array.from({ length: min - list.length }, () => ({ ...empty }))];
}
