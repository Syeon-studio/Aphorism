import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Editor from "@/components/editor/Editor";
import { getArtistById } from "@/lib/admin/server";
import { ADMIN_METADATA, requireAdmin } from "@/lib/admin/load";
import { EMPTY_CONTENT, hasUnpublishedChanges } from "@/lib/content";
import { imageBaseUrl } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "관리자 · 작가 편집", ...ADMIN_METADATA };

export default function AdminArtistPage({ params }: PageProps<"/admin/[adminToken]/artists/[id]">) {
  return (
    <main className="flex-1 bg-[#fafaf8]">
      <Suspense fallback={<p className="py-24 text-center text-sm opacity-60">불러오는 중…</p>}>
        <Body params={params} />
      </Suspense>
    </main>
  );
}

async function Body({ params }: Pick<PageProps<"/admin/[adminToken]/artists/[id]">, "params">) {
  const { adminToken, id } = await params;
  if (!(await requireAdmin(adminToken))) return <p className="px-4 py-24 text-center">DB가 연결되지 않았습니다.</p>;
  const artist = await getArtistById(id);
  if (!artist) notFound();
  const base = `/admin/${adminToken}`;
  return (
    <Editor
      apiBase={`/api${base}/artists/${id}`}
      previewUrl={`${base}/artists/${id}/preview`}
      admin={{ backHref: base }}
      artistId={artist.id}
      slug={artist.slug}
      imageBase={imageBaseUrl()}
      initialContent={artist.draft ?? artist.published ?? EMPTY_CONTENT}
      initialUpdatedAt={artist.updated_at}
      publishedAt={artist.published_at}
      hasPublished={Boolean(artist.published)}
      hasUnpublished={hasUnpublishedChanges(artist.draft, artist.published)}
      deadline={null}
      closed={false}
    />
  );
}
