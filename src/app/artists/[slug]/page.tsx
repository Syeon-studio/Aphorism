import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ArtistView from "@/components/ArtistView";
import SiteNav from "@/components/SiteNav";
import { getAdjacentArtists, getArtist, getArtists } from "@/lib/data";

export async function generateStaticParams() {
  const artists = await getArtists();
  // cacheComponents에서는 빈 배열이 빌드 오류 → 공개된 작가가 없으면 404가 될 자리표시자 하나
  if (artists.length === 0) return [{ slug: "_" }];
  return artists.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/artists/[slug]">): Promise<Metadata> {
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

/**
 * params는 반드시 <Suspense> 안에서 읽는다 (Next 16 Cache Components).
 * 밖에서 읽으면 "완료" 후 페이지를 다시 만들 때 NEXT_STATIC_GEN_BAILOUT으로 500이 난다.
 * 목록에 있는 작가는 빌드 때 전부 미리 만들어지므로 대기 화면은 거의 보이지 않는다.
 */
export default function ArtistPage({ params }: PageProps<"/artists/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16 tablet:px-8 wide:pt-20">
      <Nav />
      <Suspense fallback={<p className="py-24 text-center text-sm opacity-60">불러오는 중…</p>}>
        <ArtistBody params={params} />
      </Suspense>
    </main>
  );
}

/** 메뉴의 작가 목록 (캐시된 데이터라 params와 무관하게 정적으로 그려진다) */
async function Nav() {
  const artists = await getArtists();
  return <SiteNav artists={artists.map((a) => ({ slug: a.slug, name: a.name }))} />;
}

async function ArtistBody({ params }: Pick<PageProps<"/artists/[slug]">, "params">) {
  const { slug } = await params;
  const artist = await getArtist(slug);
  if (!artist) notFound();
  const { prev, next } = await getAdjacentArtists(slug);
  return <ArtistView artist={artist} prev={prev} next={next} />;
}
