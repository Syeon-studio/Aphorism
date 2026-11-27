import type { Metadata } from "next";
import { Suspense } from "react";
import DraftPreview from "@/components/DraftPreview";
import { loadEditable } from "@/lib/edit/load";

export const metadata: Metadata = {
  title: "미리보기",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

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
  return <DraftPreview content={data.content} />;
}
