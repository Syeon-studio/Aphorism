"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavArtist = { slug: string; name: string };

/**
 * 공개 사이트 메뉴: Home / 전시 서문 / 참여작가(+작가명) / Contact
 * - 넓은 화면(데스크톱·태블릿 가로, `wide:`): 상단 고정 바. 참여작가에 마우스·포커스를 두면 작가명 목록
 * - 좁은 화면(모바일·태블릿 세로): 오른쪽 위 햄버거 버튼 → 전체 화면 메뉴
 * hero: 메인 첫 화면(포스터) 위에서는 투명 배경·밝은 글자, 스크롤하면 흰 배경
 */
export default function SiteNav({ artists, hero = false }: { artists: NavArtist[]; hero?: boolean }) {
  const [overHero, setOverHero] = useState(hero);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hero) return;
    const update = () => setOverHero(window.scrollY < window.innerHeight - 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [hero]);

  // 메뉴 열림: 스크롤 잠금, ESC로 닫기, 첫 링크에 포커스. 닫히면 버튼으로 포커스 복귀
  useEffect(() => {
    if (!open) return;
    const button = buttonRef.current;
    document.documentElement.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  const links = [
    { href: "/#top", label: "Home" },
    { href: "/#intro", label: "전시 서문" },
    { href: "/#artists", label: "참여작가", artists: true },
    { href: "/#contact", label: "Contact" },
  ];

  const light = overHero; // 포스터 위: 밝은 글자

  return (
    <>
      {/* 넓은 화면: 상단 바 */}
      <header
        className={`fixed inset-x-0 top-0 z-40 hidden h-14 transition-colors duration-300 wide:block ${
          light ? "bg-transparent text-[#f5f2ec]" : "border-b border-black/10 bg-white/90 text-black backdrop-blur"
        }`}
      >
        <nav aria-label="사이트 메뉴" className="mx-auto flex h-full max-w-6xl items-center justify-between px-8">
          <Link href="/#top" className="font-bold tracking-tight">
            Overload
          </Link>
          <ul className="flex items-center gap-8 text-sm font-bold">
            {links.map((l) =>
              l.artists ? (
                <li key={l.href} className="group relative">
                  <Link href={l.href} className="inline-block py-4 underline-offset-4 hover:underline" aria-haspopup="true">
                    {l.label}
                  </Link>
                  <div className="invisible absolute top-full right-1/2 w-72 translate-x-1/2 pt-1 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-black/10 bg-white p-4 text-xs font-normal text-black shadow-lg">
                      {artists.map((a) => (
                        <li key={a.slug}>
                          <Link href={`/artists/${a.slug}`} className="block py-1 hover:underline">
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ) : (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block py-4 underline-offset-4 hover:underline">
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </header>

      {/* 좁은 화면: 햄버거 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        aria-expanded={open}
        aria-controls="site-menu"
        className={`fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-[calc(0.75rem+env(safe-area-inset-right))] z-40 flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-full transition-colors wide:hidden ${
          light ? "bg-white/10 text-[#f5f2ec] backdrop-blur" : "bg-white/90 text-black shadow-md backdrop-blur"
        }`}
      >
        <span className="h-0.5 w-5 rounded bg-current" />
        <span className="h-0.5 w-5 rounded bg-current" />
        <span className="h-0.5 w-5 rounded bg-current" />
      </button>

      {open && (
        <div
          id="site-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="사이트 메뉴"
          className="fixed inset-0 z-50 overflow-y-auto bg-white px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] text-black wide:hidden"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="메뉴 닫기"
            className="fixed top-[calc(0.75rem+env(safe-area-inset-top))] right-[calc(0.75rem+env(safe-area-inset-right))] flex h-11 w-11 items-center justify-center rounded-full bg-black/5 text-xl"
          >
            ✕
          </button>
          <nav aria-label="사이트 메뉴" className="mt-14">
            <ul className="grid gap-6 text-3xl font-bold">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                  {l.artists && (
                    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-base font-normal opacity-70">
                      {artists.map((a) => (
                        <li key={a.slug}>
                          <Link href={`/artists/${a.slug}`} onClick={() => setOpen(false)} className="underline-offset-4 hover:underline">
                            {a.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </>
  );
}
