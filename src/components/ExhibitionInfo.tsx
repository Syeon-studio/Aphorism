import type { ReactNode } from "react";
import { EXHIBITION } from "@/lib/exhibition";

/** 전시 정보 · Contact */
export default function ExhibitionInfo() {
  const e = EXHIBITION;
  const instagramHandle = e.instagram.replace(/^@/, "");
  const hasContact = Boolean(e.contactEmail || instagramHandle);

  const rows: [string, ReactNode][] = [
    ["기간", e.periodLabel],
    ["오프닝", "2026년 12월 22일(화) 14:00"],
    ["운영시간", e.hoursLabel],
    ["휴관", e.closedLabel],
    ["입장료", e.admission],
    [
      "장소",
      <>
        {e.venue}
        <br />
        {e.address}
        <br />
        <a
          href={e.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block underline underline-offset-4"
        >
          지도 보기 ↗
        </a>
      </>,
    ],
  ];

  return (
    <div className="grid gap-12 desktop:grid-cols-2">
      <div>
        <h2 className="text-xl font-bold">전시 정보</h2>
        <dl className="mt-6 grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="opacity-60">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h2 className="text-xl font-bold">Contact</h2>
        {hasContact ? (
          <dl className="mt-6 grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-3">
            {e.contactEmail && (
              <>
                <dt className="opacity-60">이메일</dt>
                <dd>
                  <a href={`mailto:${e.contactEmail}`} className="underline underline-offset-4">
                    {e.contactEmail}
                  </a>
                </dd>
              </>
            )}
            {instagramHandle && (
              <>
                <dt className="opacity-60">인스타그램</dt>
                <dd>
                  <a
                    href={`https://www.instagram.com/${instagramHandle}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    @{instagramHandle}
                  </a>
                </dd>
              </>
            )}
          </dl>
        ) : (
          <p className="mt-6 opacity-60">연락처는 추후 안내됩니다.</p>
        )}
      </div>
    </div>
  );
}
