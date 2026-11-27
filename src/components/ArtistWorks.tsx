"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "@/components/Lightbox";
import { distributeToColumns } from "@/lib/masonry";
import type { Work } from "@/types/content";

/**
 * 출품작 메이슨리 + 라이트박스.
 * 열 수는 모바일 2 / 태블릿·데스크톱 3. 두 배치를 모두 계산해 두고 CSS로 전환한다
 * (화면 폭을 JS로 재지 않으므로 첫 렌더부터 자리가 고정된다).
 * display:none인 배치의 lazy 이미지는 브라우저가 내려받지 않는다.
 */
export default function ArtistWorks({ works }: { works: Work[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (works.length === 0) return null;

  return (
    <>
      <Masonry works={works} columns={2} className="grid tablet:hidden" onOpen={setOpenIndex} />
      <Masonry works={works} columns={3} className="hidden tablet:grid" onOpen={setOpenIndex} />
      <Lightbox
        works={works}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}

function Masonry({
  works,
  columns,
  className,
  onOpen,
}: {
  works: Work[];
  columns: number;
  className: string;
  onOpen: (index: number) => void;
}) {
  const cols = distributeToColumns(works, columns);
  return (
    <div
      className={`${className} items-start gap-3 tablet:gap-6`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {cols.map((col, c) => (
        <ul key={c} className="flex flex-col gap-3 tablet:gap-6">
          {col.map(({ item: work, index }) => (
            <li key={work.id}>
              <button
                type="button"
                onClick={() => onOpen(index)}
                aria-label={`${work.title} 크게 보기`}
                className="group block w-full cursor-zoom-in bg-black/5"
                style={{ aspectRatio: `${work.width} / ${work.height}` }}
              >
                <Image
                  src={work.image_thumb}
                  alt={work.title}
                  width={work.width}
                  height={work.height}
                  sizes="(min-width: 1200px) 360px, (min-width: 768px) 33vw, 50vw"
                  className="h-full w-full object-contain transition-opacity group-hover:opacity-85"
                />
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
