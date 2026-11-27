"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import WorkCredit from "@/components/WorkCredit";
import type { Work } from "@/types/content";

/**
 * 작품 라이트박스 (기획서 2-3).
 * - 모바일·태블릿 세로: 사진(가로 폭 맞춤) → 가운데 캡션 → ← → → 작품 설명 (세로 스크롤)
 * - 데스크톱·태블릿 가로(wide:): 왼쪽 사진, 오른쪽 360px 텍스트 패널(패널 안에서만 스크롤)
 * - 이동: ← → 버튼, 키보드 ← →, 모바일 좌우 스와이프
 * - 닫기: ✕, ESC, 배경 클릭
 * <dialog>를 항상 마운트해 두고 showModal/close로 열고 닫는다 (포커스 가두기·복귀를 브라우저가 처리).
 */
export default function Lightbox({
  works,
  index,
  onClose,
  onNavigate,
}: {
  works: Work[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const open = index !== null;
  const work = open ? works[index] : null;
  const count = works.length;

  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onNavigate((index + delta + count) % count);
    },
    [index, count, onNavigate],
  );

  // 열고 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    if (!open) document.documentElement.style.overflow = "";
  }, [open]);

  useEffect(() => () => void (document.documentElement.style.overflow = ""), []);

  // 작품이 바뀌면 스크롤을 맨 위로
  useEffect(() => {
    dialogRef.current?.querySelectorAll("[data-scroll]").forEach((el) => el.scrollTo(0, 0));
  }, [index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const navButtons = (
    <div className="flex items-center justify-center gap-6 wide:justify-between">
      <button type="button" onClick={() => go(-1)} aria-label="이전 작품" className="lb-btn">
        ←
      </button>
      <span className="text-sm tabular-nums opacity-60" aria-live="polite">
        {index !== null ? index + 1 : 0} / {count}
      </span>
      <button type="button" onClick={() => go(1)} aria-label="다음 작품" className="lb-btn">
        →
      </button>
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-label={work ? `작품 보기: ${work.title}` : "작품 보기"}
      onCancel={(e) => {
        e.preventDefault(); // ESC: 상태로 닫아 동기화
        onClose();
      }}
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // 배경 클릭으로 닫기: 사진·버튼·글자 이외의 빈 곳을 누르면 닫는다
        if (!(e.target as HTMLElement).closest("img, button, a, p, span, [data-keep]")) onClose();
      }}
      className="lightbox m-0 h-dvh max-h-none w-screen max-w-none bg-black/85 p-0 text-white backdrop:bg-transparent"
    >
      {work && (
        <div
          data-scroll
          className="flex min-h-full flex-col overflow-y-auto wide:h-full wide:flex-row wide:overflow-hidden"
        >
          {/* 사진 영역 */}
          <div
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="flex justify-center px-4 pt-[calc(4rem+env(safe-area-inset-top))] wide:min-w-0 wide:flex-1 wide:px-8 wide:pt-[max(2rem,env(safe-area-inset-top))] wide:pb-[max(2rem,env(safe-area-inset-bottom))] wide:pl-[max(2rem,env(safe-area-inset-left))]"
          >
            <div className="relative w-full wide:h-full">
              <Image
                key={work.id}
                src={work.image_full}
                alt={work.title}
                width={work.width}
                height={work.height}
                sizes="(min-width: 1200px) calc(100vw - 424px), 100vw"
                className="mx-auto h-auto max-h-[70svh] w-auto max-w-full object-contain wide:absolute wide:inset-0 wide:h-full wide:max-h-none wide:w-full"
              />
            </div>
          </div>

          {/* 텍스트 영역 */}
          <div className="px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] wide:flex wide:h-full wide:w-[360px] wide:shrink-0 wide:flex-col wide:border-l wide:border-white/10 wide:bg-black/50 wide:p-0 wide:pr-[env(safe-area-inset-right)]">
            <div
              data-scroll
              className="contents wide:block wide:flex-1 wide:overflow-y-auto wide:px-6 wide:pt-[calc(4.5rem+env(safe-area-inset-top))] wide:pb-6"
            >
              <WorkCredit
                work={work}
                className="space-y-1 text-center leading-relaxed wide:text-left [&>p:first-child]:text-lg"
              />
              {work.description && (
                <p className="mx-auto mt-6 max-w-prose text-sm leading-loose whitespace-pre-line opacity-85">
                  {work.description}
                </p>
              )}
            </div>
            <div className="hidden border-t border-white/10 px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] wide:block">
              {navButtons}
            </div>
          </div>
        </div>
      )}

      {/* 모바일·태블릿 세로: 이동 버튼은 화면 하단에 고정 (작품 설명을 스크롤해도 항상 보이게) */}
      {work && (
        <div data-keep className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] wide:hidden">
          {navButtons}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="lb-btn fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-[calc(0.75rem+env(safe-area-inset-right))]"
      >
        ✕
      </button>
    </dialog>
  );
}
