/**
 * 사이트 절대 URL.
 * 도메인이 정해지면 Vercel 환경변수 NEXT_PUBLIC_SITE_URL에 넣는다.
 * 없으면 Vercel이 주는 프로덕션 주소(*.vercel.app), 그것도 없으면 로컬 주소.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
