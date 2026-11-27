import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArtistWorks from "@/components/ArtistWorks";
import { getAdjacentArtists, getArtist, getArtists } from "@/lib/data";

export async function generateStaticParams() {
  const artists = await getArtists();
  // cacheComponents에서는 빈 배열이 빌드 오류 → 공개된 작가가 없으면 404가 될 자리표시자 하나
  if (artists.length === 0) return [{ slug: "_" }];
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/artists/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) return {};
  const description = artist.bio.replace(/\s+/g, " ").slice(0, 120);
  return {
    title: artist.name,
    description,
    alternates: { canonical: `/artists/${artist.slug}` },
    openGraph: {
      title: artist.name,
      description,
      // 작가 페이지 공유 미리보기는 대표 사진 (기획서 5장)
      images: artist.profile_image ? [{ url: artist.profile_image, alt: artist.name }] : undefined,
    },
  };
}

export default async function ArtistPage({ params }: PageProps<"/artists/[slug]">) {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) notFound();
  const { prev, next } = await getAdjacentArtists(slug);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16 tablet:px-8">
      <nav aria-label="사이트">
        <Link href="/" className="inline-block py-2 text-sm underline-offset-4 hover:underline">
          ← 전시 메인
        </Link>
      </nav>

      <header className="mt-8 grid gap-10 tablet:mt-12 desktop:grid-cols-[1fr_1fr] desktop:gap-16">
        <div>
          <h1 className="text-3xl font-bold tablet:text-4xl">{artist.name}</h1>
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
        <ArtistWorks works={artist.works} />
      </section>

      {prev && next && (
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
    </main>
  );
}
