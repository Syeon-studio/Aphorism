import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import DraftPreview from "@/components/DraftPreview";
import { getArtistById } from "@/lib/admin/server";
import { ADMIN_METADATA, requireAdmin } from "@/lib/admin/load";
import { coerceContent } from "@/lib/content";

export const metadata: Metadata = { title: "관리자 · 미리보기", ...ADMIN_METADATA };

export default function AdminPreviewPage({ params }: PageProps<"/admin/[adminToken]/artists/[id]/preview">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<p className="py-24 text-center text-sm opacity-60">불러오는 중…</p>}>
        <Body params={params} />
      </Suspense>
    </main>
  );
}

async function Body({ params }: Pick<PageProps<"/admin/[adminToken]/artists/[id]/preview">, "params">) {
  const { adminToken, id } = await params;
  if (!(await requireAdmin(adminToken))) return <p className="px-4 py-24 text-center">DB가 연결되지 않았습니다.</p>;
  const artist = await getArtistById(id);
  if (!artist) notFound();
  return <DraftPreview content={coerceContent(artist.draft ?? artist.published)} />;
}
