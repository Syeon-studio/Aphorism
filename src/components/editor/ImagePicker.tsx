"use client";

import { useRef } from "react";
import { ACCEPT } from "@/lib/edit/image-client";

export type UploadState = { phase: "processing" } | { phase: "uploading"; percent: number } | null;

/**
 * 사진 선택·교체·삭제. 실제 처리·업로드는 onSelect를 받은 쪽(Editor)이 한다.
 * src: 표시할 이미지 URL (없으면 빈 칸)
 */
export default function ImagePicker({
  src,
  alt,
  aspect,
  state,
  disabled,
  onSelect,
  onRemove,
  label,
}: {
  src: string;
  alt: string;
  /** 빈 칸일 때 자리 비율 (예: "4 / 5") */
  aspect: string;
  state: UploadState;
  disabled?: boolean;
  onSelect: (file: File) => void;
  onRemove?: () => void;
  label: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const busy = state !== null;

  return (
    <div>
      <div
        className="relative overflow-hidden rounded-lg border border-dashed border-black/20 bg-black/[0.03]"
        style={src ? undefined : { aspectRatio: aspect }}
      >
        {src ? (
          // 편집 화면은 원본 비율 그대로 미리보기 (next/image 최적화 불필요)
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="block h-auto w-full" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm opacity-50">
            사진 없음
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 p-4" role="status">
            <span className="text-sm font-bold">
              {state.phase === "processing" ? "사진 처리 중…" : `업로드 중 ${state.percent}%`}
            </span>
            <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full bg-black transition-[width]"
                style={{ width: state.phase === "processing" ? "15%" : `${state.percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-black/20 px-3 py-2 text-sm font-bold disabled:opacity-40"
        >
          {src ? "사진 교체" : label}
        </button>
        {src && onRemove && (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={onRemove}
            className="rounded-lg px-3 py-2 text-sm text-[#d33] disabled:opacity-40"
          >
            사진 삭제
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = ""; // 같은 파일을 다시 골라도 동작하도록
          if (f) onSelect(f);
        }}
      />
    </div>
  );
}
