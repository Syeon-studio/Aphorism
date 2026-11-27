"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 화면에 들어올 때 가볍게 떠오르는 효과.
 * - JS가 없거나 prefers-reduced-motion이면 처음부터 보인다.
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // hidden: 아직 화면 밖(효과 대기), shown: 보임
  const [state, setState] = useState<"initial" | "hidden" | "shown">("initial");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // 이미 화면 안
    setState("hidden");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,translate] duration-700 ease-out ${
        state === "hidden" ? "translate-y-4 opacity-0" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
