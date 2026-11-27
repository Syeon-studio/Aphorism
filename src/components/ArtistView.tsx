import Link from "next/link";
import ArtistWorks from "@/components/ArtistWorks";
import type { ArtistContent } from "@/types/content";

type Neighbor = { slug: string; name: string };

/**
 * 작가 상세 화면 본문. 공개 페이지(/artists/[slug])와 편집 미리보기가 함께 쓴다.
 * preview: 미리보기에서는 다른 페이지로 나가는 링크를 숨긴다.
 */
export default function ArtistView({
  artist,
  prev,
  next,
  preview = false,
}: {
  artist: ArtistContent;
  prev?: Neighbor | null;
  next?: Neighbor | null;
  preview?: boolean;
}) {
  return (
    <>
      {!preview && (
        <nav aria-label="사이트">
          <Link href="/" className="inline-block py-2 text-sm underline-offset-4 hover:underline">
            ← 전시 메인
          </Link>
        </nav>
      )}

      <header className="mt-8 grid gap-10 tablet:mt-12 desktop:grid-cols-[1fr_1fr] desktop:gap-16">
        <div>
          <h1 className="text-3xl font-bold tablet:text-4xl">{artist.name || "(작가명 없음)"}</h1>
          {artist.bio && <p className="mt-6 leading-loose whitespace-pre-line">{artist.bio}</p>}
          {artist.website && (
            <p className="mt-6">
              <a
                href={artist.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                작가 웹사이트 ↗
              </a>
            </p>
          )}
        </div>

        <div className="grid gap-8 text-sm leading-relaxed tablet:grid-cols-2 desktop:grid-cols-1">
          {artist.education && (
            <section>
              <h2 className="mb-2 font-bold">학력</h2>
              <p className="whitespace-pre-line opacity-80">{artist.education}</p>
            </section>
          )}
          {artist.exhibitions && (
            <section>
              <h2 className="mb-2 font-bold">전시 경력</h2>
              <p className="whitespace-pre-line opacity-80">{artist.exhibitions}</p>
            </section>
          )}
        </div>
      </header>

      <section aria-labelledby="works-title" className="mt-16 tablet:mt-20">
        <h2 id="works-title" className="mb-6 text-xl font-bold">
          출품작
        </h2>
        {/* 사진이 없는 작품(작성 중)은 표시하지 않는다 */}
        <ArtistWorks works={artist.works.filter((w) => w.image_thumb && w.width && w.height)} />
      </section>

      {!preview && prev && next && (
        <nav
          aria-label="다른 작가"
          className="mt-20 flex items-center justify-between gap-4 border-t border-current/10 pt-6"
        >
          <Link href={`/artists/${prev.slug}`} className="py-2 underline-offset-4 hover:underline">
            ← {prev.name}
          </Link>
          <Link href="/#artists-title" className="py-2 text-sm opacity-60 hover:opacity-100">
            작가 목록
          </Link>
          <Link href={`/artists/${next.slug}`} className="py-2 underline-offset-4 hover:underline">
            {next.name} →
          </Link>
        </nav>
      )}
    </>
  );
}
