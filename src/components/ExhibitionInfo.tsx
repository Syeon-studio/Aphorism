import type { ReactNode } from "react";
import { formatClosed, formatDateTime, formatPeriod } from "@/lib/format";
import type { Settings } from "@/types/content";

/** 전시 정보 · Contact */
export default function ExhibitionInfo({ settings: e }: { settings: Settings }) {
  const instagramHandle = e.instagram.trim().replace(/^@/, "");
  const hasContact = Boolean(e.contact_email || instagramHandle);

  const rows: [string, ReactNode][] = (
    [
      ["기간", formatPeriod(e)],
      ["오프닝", formatDateTime(e.opening_at)],
      ["운영시간", e.hours],
      ["휴관", formatClosed(e)],
      ["입장료", e.admission],
    ] as [string, ReactNode][]
  ).filter(([, v]) => Boolean(v));
  rows.push([
    "장소",
    <>
      {e.venue}
      <br />
      {e.address}
      {e.map_url && (
        <>
          <br />
          <a
            href={e.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block underline underline-offset-4"
          >
            지도 보기 ↗
          </a>
        </>
      )}
    </>,
  ]);

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
            {e.contact_email && (
              <>
                <dt className="opacity-60">이메일</dt>
                <dd>
                  <a href={`mailto:${e.contact_email}`} className="underline underline-offset-4">
                    {e.contact_email}
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
