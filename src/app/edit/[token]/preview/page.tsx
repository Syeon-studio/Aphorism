import type { Metadata } from "next";
import { Suspense } from "react";
import ArtistView from "@/components/ArtistView";
import { loadEditable } from "@/lib/edit/load";
import { imageUrl } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "미리보기",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** 임시저장된 내용(draft)을 공개 페이지와 같은 모양으로 보여준다 */
export default function PreviewPage({ params }: PageProps<"/edit/[token]/preview">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<p className="py-24 text-center text-sm opacity-60">불러오는 중…</p>}>
        <PreviewBody params={params} />
      </Suspense>
    </main>
  );
}

async function PreviewBody({ params }: Pick<PageProps<"/edit/[token]/preview">, "params">) {
  const { token } = await params;
  const data = await loadEditable(token);
  if (!data) return <p className="px-4 py-24 text-center">편집 기능이 아직 연결되지 않았습니다.</p>;
  const c = data.content;
  const artist = {
    ...c,
    profile_image: imageUrl(c.profile_image),
    works: c.works.map((w) => ({ ...w, image_full: imageUrl(w.image_full), image_thumb: imageUrl(w.image_thumb) })),
  };
  return (
    <>
      <div className="sticky top-0 z-30 bg-[#fff4d6] px-4 py-2 text-center text-sm font-bold text-[#7a5b00]">
        미리보기 · 임시저장된 내용입니다 (공개 사이트에는 &quot;완료&quot;를 눌러야 반영됩니다)
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16 tablet:px-8">
        <ArtistView artist={artist} preview />
      </div>
    </>
  );
}
