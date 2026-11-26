import { ARTIST_NAMES, EXHIBITION } from "@/lib/exhibition";

// 초기 세팅용 임시 메인. 1단계에서 포스터·서문·작가 목록·전시 정보로 교체한다.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 tablet:px-8">
      <h1 className="text-3xl font-bold tablet:text-5xl">{EXHIBITION.title}</h1>

      <dl className="mt-10 grid grid-cols-[5rem_1fr] gap-x-4 gap-y-2">
        <dt className="opacity-60">기간</dt>
        <dd>{EXHIBITION.periodLabel}</dd>
        <dt className="opacity-60">운영</dt>
        <dd>{EXHIBITION.hoursLabel}</dd>
        <dt className="opacity-60">휴관</dt>
        <dd>{EXHIBITION.closedLabel}</dd>
        <dt className="opacity-60">입장료</dt>
        <dd>{EXHIBITION.admission}</dd>
        <dt className="opacity-60">장소</dt>
        <dd>
          {EXHIBITION.venue}
          <br />
          <a
            href={EXHIBITION.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            {EXHIBITION.address}
          </a>
        </dd>
      </dl>

      <section className="mt-12">
        <h2 className="text-lg font-bold">참여 작가</h2>
        <p className="mt-2">{ARTIST_NAMES.join(", ")}</p>
      </section>
    </main>
  );
}
