import ArtistGrid from "@/components/ArtistGrid";
import ExhibitionInfo from "@/components/ExhibitionInfo";
import Poster from "@/components/Poster";
import Reveal from "@/components/Reveal";
import { getArtists, getIntroText } from "@/lib/data";
import { EXHIBITION } from "@/lib/exhibition";

export default async function Home() {
  const [intro, artists] = await Promise.all([getIntroText(), getArtists()]);

  return (
    <main className="flex-1">
      <h1 className="sr-only">{EXHIBITION.title}</h1>
      <Poster />

      <div className="mx-auto w-full max-w-6xl px-4 tablet:px-8">
        <section id="intro" aria-labelledby="intro-title" className="scroll-mt-4 py-20 tablet:py-28">
          <Reveal className="mx-auto max-w-2xl">
            <h2 id="intro-title" className="text-xl font-bold">
              전시 서문
            </h2>
            <p className="mt-6 text-lg leading-loose whitespace-pre-line">{intro}</p>
          </Reveal>
        </section>

        <section aria-labelledby="artists-title" className="py-16 tablet:py-20">
          <Reveal>
            <h2 id="artists-title" className="mb-8 text-xl font-bold">
              참여 작가
            </h2>
            <ArtistGrid artists={artists} />
          </Reveal>
        </section>

        <section id="info" aria-label="전시 정보와 연락처" className="py-16 tablet:py-20">
          <Reveal>
            <ExhibitionInfo />
          </Reveal>
        </section>
      </div>
    </main>
  );
}
