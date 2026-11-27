import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isAdminToken } from "@/lib/admin/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/** 관리자 페이지 공통: 토큰이 틀리면 404 (관리자 화면의 존재를 드러내지 않음) */
export async function requireAdmin(adminToken: string): Promise<boolean> {
  await connection();
  if (!isAdminToken(adminToken)) notFound();
  return isSupabaseConfigured();
}

export const ADMIN_METADATA = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
