import type { Metadata } from "next";
import { Suspense } from "react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { getSettingsFresh, listArtists } from "@/lib/admin/server";
import { ADMIN_METADATA, requireAdmin } from "@/lib/admin/load";
import { getSiteUrl } from "@/lib/site";

export const metadata: Metadata = { title: "관리자", ...ADMIN_METADATA };

/** /admin/[ADMIN_TOKEN] — 토큰이 틀리면 404 */
export default function AdminPage({ params }: PageProps<"/admin/[adminToken]">) {
  return (
    <main className="flex-1 bg-[#fafaf8]">
      <Suspense fallback={<p className="py-24 text-center text-sm opacity-60">불러오는 중…</p>}>
        <Body params={params} />
      </Suspense>
    </main>
  );
}

async function Body({ params }: Pick<PageProps<"/admin/[adminToken]">, "params">) {
  const { adminToken } = await params;
  if (!(await requireAdmin(adminToken))) return <p className="px-4 py-24 text-center">DB가 연결되지 않았습니다.</p>;
  const [artists, settings] = await Promise.all([listArtists(), getSettingsFresh()]);
  return <AdminDashboard adminToken={adminToken} siteUrl={getSiteUrl()} artists={artists} settings={settings} />;
}
