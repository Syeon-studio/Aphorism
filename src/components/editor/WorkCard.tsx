"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { LIMITS } from "@/lib/content";
import type { Work } from "@/types/content";
import { TextArea, TextField } from "./fields";
import ImagePicker, { type UploadState } from "./ImagePicker";

/**
 * 작품 1점 편집 카드.
 * - 순서 변경: 손잡이(⠿)를 끌기(마우스·터치) 또는 ▲▼ 버튼
 * - 머리 부분만 보이게 접을 수 있다 (작품이 많을 때 끌기 편하도록)
 */
export default function WorkCard({
  work,
  index,
  total,
  imageSrc,
  uploadState,
  disabled,
  defaultOpen,
  onChange,
  onImage,
  onRemoveImage,
  onMove,
  onDelete,
}: {
  work: Work;
  index: number;
  total: number;
  imageSrc: string;
  uploadState: UploadState;
  disabled: boolean;
  defaultOpen: boolean;
  onChange: (patch: Partial<Work>) => void;
  onImage: (file: File) => void;
  onRemoveImage: () => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: work.id,
    disabled,
  });
  const n = index + 1;
  const missing = [!work.image_thumb && "사진", !work.title && "제목"].filter(Boolean).join("·");

  return (
    <li
      id={`work-${work.id}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-white ${isDragging ? "relative z-10 border-black shadow-xl" : "border-black/15"}`}
    >
      {/* 머리: 손잡이 · 썸네일 · 제목 · 순서 버튼 */}
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={`${n}번째 작품 순서 끌어서 옮기기`}
          className="flex h-11 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-xl opacity-50 active:cursor-grabbing disabled:cursor-default disabled:opacity-20"
        >
          ⠿
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg py-1 text-left tablet:gap-3"
        >
          {/* 순서 번호 (공개 페이지에 이 순서대로 보인다) */}
          <span className="w-6 shrink-0 text-center text-lg font-bold tabular-nums" aria-hidden="true">
            {n}
          </span>
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded bg-black/5">
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="" className="h-full w-full object-cover" />
            )}
          </span>
          <span className="min-w-0">
            <span className="sr-only">작품 {n}</span>
            <span className="block truncate font-bold">{work.title || "(제목 없음)"}</span>
            {missing && <span className="block text-xs text-[#d33]">{missing} 필요</span>}
          </span>
          <span className="ml-auto shrink-0 px-1 text-sm opacity-50" aria-hidden="true">
            <span className="hidden tablet:inline">{open ? "접기 " : "펼치기 "}</span>
            {open ? "▴" : "▾"}
          </span>
        </button>
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={disabled || index === 0}
            aria-label={`${n}번째 작품 위로`}
            className="h-6 w-9 rounded text-sm disabled:opacity-20"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={disabled || index === total - 1}
            aria-label={`${n}번째 작품 아래로`}
            className="h-6 w-9 rounded text-sm disabled:opacity-20"
          >
            ▼
          </button>
        </div>
      </div>

      {open && (
        <fieldset disabled={disabled} className="grid gap-4 border-t border-black/10 p-4 tablet:grid-cols-[minmax(0,240px)_1fr]">
          <legend className="sr-only">작품 {n} 정보</legend>
          <ImagePicker
            src={imageSrc}
            alt={work.title || `작품 ${n}`}
            aspect="4 / 3"
            state={uploadState}
            disabled={disabled}
            onSelect={onImage}
            onRemove={onRemoveImage}
            label="작품 사진 올리기 *"
          />
          <div className="grid gap-4">
            <TextField label="제목" required value={work.title} onChange={(v) => onChange({ title: v })} maxLength={LIMITS.title} />
            <div className="grid gap-4 tablet:grid-cols-2">
              <TextField label="년도" value={work.year ?? ""} onChange={(v) => onChange({ year: v })} maxLength={LIMITS.line} placeholder="2026, 2024–2026" />
              <TextField label="재료" value={work.medium ?? ""} onChange={(v) => onChange({ medium: v })} maxLength={LIMITS.line} placeholder="캔버스에 유채" />
              <TextField label="크기" value={work.size ?? ""} onChange={(v) => onChange({ size: v })} maxLength={LIMITS.line} placeholder="130 × 97 cm" />
              <TextField label="기타 정보" value={work.etc ?? ""} onChange={(v) => onChange({ etc: v })} maxLength={LIMITS.line} placeholder="에디션, 소장처 등" />
            </div>
            <TextField
              label="사진 촬영자"
              value={work.photo_credit ?? ""}
              onChange={(v) => onChange({ photo_credit: v })}
              maxLength={LIMITS.line}
              hint="적으면 작품 캡션에 '사진: 이름'으로 표시됩니다."
            />
            <TextArea label="작품 설명" value={work.description ?? ""} onChange={(v) => onChange({ description: v })} maxLength={LIMITS.description} rows={4} />
            <div className="text-right">
              <button type="button" onClick={onDelete} className="rounded-lg px-3 py-2 text-sm text-[#d33]">
                이 작품 삭제
              </button>
            </div>
          </div>
        </fieldset>
      )}
    </li>
  );
}
