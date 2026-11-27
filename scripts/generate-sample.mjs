/**
 * 1단계용 더미 데이터 생성기.
 *   node scripts/generate-sample.mjs
 * → data/sample.json + public/sample/{slug}/*.webp
 *
 * 작가명만 실명이고 소개·작품·이미지는 모두 더미다.
 * 2단계(Supabase 연결) 이후에는 사용하지 않는다.
 */
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_IMG = path.join(ROOT, "public", "sample");
const OUT_JSON = path.join(ROOT, "data", "sample.json");

// slug는 임시 로마자 표기. 작가 확인 후 수정
const ARTISTS = [
  ["김미내", "kim-minae", 12],
  ["김태현", "kim-taehyun", 200],
  ["맹욱재", "maeng-ukjae", 95],
  ["박하영", "park-hayoung", 330],
  ["시언", "syeon", 265],
  ["이민영", "lee-minyoung", 40],
  ["이철영", "lee-cheolyoung", 160],
  ["필독", "pildok", 300],
];

// 작품 비율 [가로, 세로] — 메이슨리 확인용으로 다양하게
const RATIOS = [
  [4, 5], [3, 2], [1, 1], [2, 3], [16, 9], [3, 4], [5, 4], [9, 16],
];

const TITLES = [
  "무제", "과잉의 밤", "흘러넘치는 오후", "잔향", "포화 상태", "고요의 무게",
  "번짐", "얇은 막", "소음의 지도", "쌓이는 것들", "열기", "남겨진 온도",
];
const MEDIA = [
  "캔버스에 유채", "종이에 수채", "장지에 먹, 채색", "디지털 프린트",
  "혼합 매체", "단채널 영상, 컬러, 사운드", "아크릴, 패널", "",
];

// 더미 텍스트: Lorem Ipsum (서문 300자 · 작가소개 200자 · 작품설명 150자)
const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
  "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
  "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ";

/** 정확히 n자, 단어 단위로 자르고 마침표로 끝낸다 (자투리 칸은 다음 단어의 앞부분으로 채움) */
function lorem(n) {
  const words = LOREM.repeat(4).replace(/[.,]/g, "").trim().split(/\s+/);
  let t = "";
  let i = 0;
  while ((t ? t.length + 1 : 0) + words[i].length <= n - 1) {
    t += (t ? " " : "") + words[i];
    i++;
  }
  const rest = n - 1 - t.length;
  if (rest >= 2) t += " " + words[i].slice(0, rest - 1);
  else if (rest === 1) t += words[i][0];
  return t + ".";
}

const INTRO = lorem(300);
const BIO = lorem(200);
const DESC = lorem(150);
const EDU = [
  { degree: "MFA", school: "OO대학교 대학원", major: "회화" },
  { degree: "BFA", school: "OO대학교", major: "서양화" },
];
// 전시 경력 더미: "2026 「전시제목」, 전시장, 서울"로 통일
const EXH = Array.from({ length: 5 }, () => ({ year: "2026", title: "전시제목", venue: "전시장", region: "서울" }));

function hsl(h, s, l) {
  return `hsl(${h % 360}, ${s}%, ${l}%)`;
}

function svgArt(w, h, hue, seed, label) {
  // 간단한 추상 패턴: 배경 + 겹친 원 몇 개
  const rnd = mulberry32(seed);
  const circles = Array.from({ length: 6 }, () => {
    const r = (0.15 + rnd() * 0.35) * Math.min(w, h);
    return `<circle cx="${rnd() * w}" cy="${rnd() * h}" r="${r}" fill="${hsl(
      hue + rnd() * 60 - 30, 55, 45 + rnd() * 30,
    )}" fill-opacity="0.55"/>`;
  }).join("");
  const fs = Math.round(Math.min(w, h) * 0.07);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${hsl(hue, 30, 88)}"/>
    ${circles}
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
      font-family="sans-serif" font-size="${fs}" fill="rgba(0,0,0,0.45)">${label}</text>
  </svg>`);
}

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function writeWebp(svg, file, width) {
  await sharp(svg).resize({ width }).webp({ quality: 60 }).toFile(file);
}

async function main() {
  await fs.rm(OUT_IMG, { recursive: true, force: true });
  const artists = [];

  for (const [i, [name, slug, hue]] of ARTISTS.entries()) {
    const dir = path.join(OUT_IMG, slug);
    await fs.mkdir(dir, { recursive: true });

    // 대표 사진 (4:5)
    await writeWebp(svgArt(800, 1000, hue, i * 100, "PROFILE"), path.join(dir, "profile.webp"), 600);
    // 작가 프로필 사진 (흰 배경 정사각형, 회색 실루엣)
    const portrait = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
      <rect width="800" height="800" fill="#ffffff"/>
      <circle cx="400" cy="310" r="150" fill="#d6d6d6"/>
      <ellipse cx="400" cy="760" rx="270" ry="250" fill="#d6d6d6"/>
    </svg>`);
    await writeWebp(portrait, path.join(dir, "portrait.webp"), 800);

    const works = [];
    for (let j = 0; j < 4; j++) {
      const [rw, rh] = RATIOS[(i * 3 + j) % RATIOS.length];
      // 긴 변 1600 기준 원본 → full(긴 변 1600) / thumb(가로 600)
      const scale = 1600 / Math.max(rw, rh);
      const w = Math.round(rw * scale);
      const h = Math.round(rh * scale);
      const svg = svgArt(w, h, hue, i * 100 + j + 1, `SAMPLE ${j + 1}`);
      const id = `w${j + 1}`;
      await writeWebp(svg, path.join(dir, `${id}_full.webp`), w);
      await writeWebp(svg, path.join(dir, `${id}_thumb.webp`), 600);

      const t = (i * 4 + j) % TITLES.length;
      works.push({
        id,
        image_full: `/sample/${slug}/${id}_full.webp`,
        image_thumb: `/sample/${slug}/${id}_thumb.webp`,
        width: w,
        height: h,
        title: TITLES[t],
        // 일부 항목은 일부러 비워 크레딧 생략 동작을 확인한다
        year: j === 3 ? "2024–2026" : "2026",
        medium: MEDIA[(i + j) % MEDIA.length],
        size: j === 2 ? "" : `${rw * 20} × ${rh * 20} cm`,
        etc: j === 1 ? "(더미) 에디션 1/3" : "",
        description: DESC,
        photo_credit: j % 2 === 0 ? "(더미) 홍길동" : "",
      });
    }

    artists.push({
      slug,
      sort_order: i + 1,
      name,
      profile_image: `/sample/${slug}/profile.webp`,
      portrait_image: `/sample/${slug}/portrait.webp`,
      bio: BIO,
      education: EDU,
      exhibitions: EXH,
      website: i % 3 === 0 ? "https://example.com" : "",
      works,
    });
  }

  const data = {
    _note: "1단계 더미 데이터. 작가명 외 모든 내용은 임시. scripts/generate-sample.mjs로 생성",
    intro_text: INTRO,
    artists,
  };
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote ${artists.length} artists`);
}

main();
