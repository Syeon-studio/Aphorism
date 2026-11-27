import ArtistGrid from "@/components/ArtistGrid";
import ExhibitionInfo from "@/components/ExhibitionInfo";
import Poster from "@/components/Poster";
import Reveal from "@/components/Reveal";
import SiteNav from "@/components/SiteNav";
import { getArtists, getSettings } from "@/lib/data";

export default async function Home() {
  const [settings, artists] = await Promise.all([getSettings(), getArtists()]);

  return (
    <main className="flex-1">
      <SiteNav hero artists={artists.map((a) => ({ slug: a.slug, name: a.name }))} />
      <h1 className="sr-only">{settings.exhibition_title}</h1>
      <Poster />

      <div className="mx-auto w-full max-w-6xl px-4 tablet:px-8">
        <section id="intro" aria-labelledby="intro-title" className="scroll-mt-14 py-20 tablet:py-28">
          <Reveal className="mx-auto max-w-2xl">
            <h2 id="intro-title" className="text-xl font-bold">
              전시 서문
            </h2>
            <p className="mt-6 text-lg leading-loose whitespace-pre-line">{settings.intro_text}</p>
          </Reveal>
        </section>

        <section id="artists" aria-labelledby="artists-title" className="scroll-mt-14 py-16 tablet:py-20">
          <Reveal>
            <h2 id="artists-title" className="mb-8 text-xl font-bold">
              참여 작가
            </h2>
            <ArtistGrid artists={artists} />
          </Reveal>
        </section>

        <section id="contact" aria-label="전시 정보와 연락처" className="scroll-mt-14 py-16 tablet:py-20">
          <Reveal>
            <ExhibitionInfo settings={settings} />
          </Reveal>
        </section>
      </div>
    </main>
  );
}
