/**
 * data/sample.json + 기본 전시 설정 → supabase/seed.sql
 *   node scripts/generate-seed-sql.mjs
 *
 * - settings 1행과 작가 8명(draft = published = 더미 내용)을 넣는다.
 * - 이미지 경로는 "/sample/..." 그대로 → public/ 폴더의 더미 이미지를 쓴다.
 *   실제 사진은 3단계 편집 화면에서 Storage로 업로드된다.
 * - edit_token은 넣지 않는다 → DB가 랜덤 생성 (저장소에 토큰이 남지 않도록).
 * - 이미 있는 작가(slug 같음)는 내용만 덮어쓰고 토큰은 유지한다.
 * - settings가 이미 있으면 서문(intro_text)만 더미로 덮어쓴다 (연락처·마감 등 관리자가 고친 값은 유지).
 */
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const sample = JSON.parse(await fs.readFile(path.join(ROOT, "data/sample.json"), "utf8"));

// src/lib/exhibition.ts의 DEFAULT_SETTINGS와 같은 값 (TS를 직접 import할 수 없어 복제)
const S = {
  exhibition_title: "Overload: 감정의 풍경",
  period_start: "2026-12-22",
  period_end: "2026-12-31",
  venue: "역삼1동복합문화센터 1층",
  address: "서울 강남구 역삼로7길 16",
  map_url: "https://map.naver.com/p/search/" + encodeURIComponent("서울 강남구 역삼로7길 16"),
  hours: "매일 10:00–18:00 (12월 22일은 14:00 오픈)",
  closed_dates: ["2026-12-25"],
  opening_at: "2026-12-22T14:00:00+09:00",
  admission: "무료",
};

const lit = (v) => `'${String(v).replace(/'/g, "''")}'`;
const json = (v) => `$json$${JSON.stringify(v)}$json$::jsonb`;

const lines = [
  "-- 자동 생성 파일: node scripts/generate-seed-sql.mjs (직접 수정하지 말 것)",
  "-- 0001_init.sql 실행 후 SQL Editor에서 실행. 여러 번 실행해도 안전하다.",
  "-- 작가 내용은 더미(작가명만 실명). edit_token은 DB가 랜덤 생성한다.",
  "",
  "insert into public.settings (id, exhibition_title, period_start, period_end, venue, address, map_url, hours, closed_dates, opening_at, admission, intro_text)",
  `values (1, ${lit(S.exhibition_title)}, ${lit(S.period_start)}, ${lit(S.period_end)}, ${lit(S.venue)}, ${lit(S.address)}, ${lit(S.map_url)}, ${lit(S.hours)}, array[${S.closed_dates.map(lit).join(", ")}]::date[], ${lit(S.opening_at)}, ${lit(S.admission)}, ${lit(sample.intro_text)})`,
  "on conflict (id) do update set intro_text = excluded.intro_text, updated_at = now();",
  "",
];

for (const a of sample.artists) {
  const { slug, sort_order, ...content } = a;
  lines.push(
    "insert into public.artists (slug, sort_order, draft, published, published_at)",
    `values (${lit(slug)}, ${sort_order}, ${json(content)}, ${json(content)}, now())`,
    "on conflict (slug) do update set sort_order = excluded.sort_order, draft = excluded.draft,",
    "  published = excluded.published, published_at = excluded.published_at, updated_at = now();",
    "",
  );
}

await fs.writeFile(path.join(ROOT, "supabase/seed.sql"), lines.join("\n"));
console.log(`wrote supabase/seed.sql (${sample.artists.length} artists)`);
