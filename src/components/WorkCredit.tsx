import { getCreditParts } from "@/lib/credit";
import type { Work } from "@/types/content";

/** 작품 캡션. 라이트박스 등에서 사용. 형식은 lib/credit.ts 참고 */
export default function WorkCredit({
  work,
  className,
}: {
  work: Work;
  className?: string;
}) {
  const { title, details, etc, photo } = getCreditParts(work);
  return (
    <div className={className}>
      <p className="italic">{title}</p>
      {details && <p>{details}</p>}
      {etc && <p>{etc}</p>}
      {photo && <p className="text-sm opacity-70">{photo}</p>}
    </div>
  );
}
