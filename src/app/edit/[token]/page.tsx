import type { Metadata } from "next";
import { Suspense } from "react";
import Editor from "@/components/editor/Editor";
import { loadEditable } from "@/lib/edit/load";
import { imageBaseUrl } from "@/lib/supabase/server";

// 편집 화면: 검색 노출 금지, 외부로 나가는 요청에 토큰이 담긴 주소를 보내지 않음
export const metadata: Metadata = {
  title: "작가 페이지 편집",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function EditPage({ params }: PageProps<"/edit/[token]">) {
  return (
    <main className="flex-1 bg-[#fafaf8]">
      <Suspense fallback={<p className="py-24 text-center text-sm opacity-60">불러오는 중…</p>}>
        <EditLoader params={params} />
      </Suspense>
    </main>
  );
}

async function EditLoader({ params }: Pick<PageProps<"/edit/[token]">, "params">) {
  const { token } = await params;
  const data = await loadEditable(token);
  if (!data) {
    return <p className="px-4 py-24 text-center">편집 기능이 아직 연결되지 않았습니다. 관리자에게 문의해주세요.</p>;
  }
  const { artist, content, deadline, closed, hasUnpublished } = data;
  return (
    <Editor
      apiBase={`/api/edit/${token}`}
      previewUrl={`/edit/${token}/preview`}
      artistId={artist.id}
      slug={artist.slug}
      imageBase={imageBaseUrl()}
      initialContent={content}
      initialUpdatedAt={artist.updated_at}
      publishedAt={artist.published_at}
      hasPublished={Boolean(artist.published)}
      hasUnpublished={hasUnpublished}
      deadline={deadline}
      closed={closed}
    />
  );
}
