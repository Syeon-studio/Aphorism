import ArtistView from "@/components/ArtistView";
import { imageUrl } from "@/lib/supabase/server";
import type { ArtistContent } from "@/types/content";

/** 임시저장본(draft)을 공개 페이지와 같은 모양으로 (작가·관리자 미리보기 공용) */
export default function DraftPreview({ content }: { content: ArtistContent }) {
  const artist = {
    ...content,
    profile_image: imageUrl(content.profile_image),
    works: content.works.map((w) => ({ ...w, image_full: imageUrl(w.image_full), image_thumb: imageUrl(w.image_thumb) })),
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
