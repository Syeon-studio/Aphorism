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
  ["시언", "sieon", 265],
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

const BIO =
  "(더미 소개글) 일상에서 넘쳐흐르는 감정의 결을 붙잡아 화면 위에 펼쳐 놓는다. " +
  "감각이 과부하되는 순간과 그 이후에 남는 고요를 함께 기록하며, " +
  "보이지 않는 감정의 풍경을 색과 형태로 번역하는 작업을 이어오고 있다.";
const EDU = "(더미) OO대학교 대학원 회화과 졸업\n(더미) OO대학교 미술대학 서양화과 졸업";
const EXH =
  "개인전\n2025 (더미) 「감정의 온도」, 갤러리 OO, 서울\n\n" +
  "단체전\n2026 Overload: 감정의 풍경, 역삼1동복합문화센터, 서울\n" +
  "2024 (더미) 「사이의 풍경」, OO아트스페이스, 서울";
const DESC =
  "(더미 작품 설명) 감정이 한계를 넘어 흘러넘치는 순간을 겹겹의 색면으로 표현했다.\n" +
  "가까이서 볼 때와 멀리서 볼 때 서로 다른 풍경이 드러나도록 구성했다.";

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
        description: j === 2 ? "" : DESC,
        photo_credit: j % 2 === 0 ? "(더미) 홍길동" : "",
      });
    }

    artists.push({
      slug,
      sort_order: i + 1,
      name,
      profile_image: `/sample/${slug}/profile.webp`,
      bio: BIO,
      education: EDU,
      exhibitions: EXH,
      website: i % 3 === 0 ? "https://example.com" : "",
      works,
    });
  }

  const data = {
    _note: "1단계 더미 데이터. 작가명 외 모든 내용은 임시. scripts/generate-sample.mjs로 생성",
    intro_text:
      "(임시 서문) 우리는 매일 감당하기 어려운 양의 감정을 마주한다. " +
      "기쁨과 불안, 피로와 설렘이 한꺼번에 밀려드는 시대에, 감정은 종종 넘쳐흐르고 과부하된다.\n\n" +
      "《Overload: 감정의 풍경》은 여덟 명의 작가가 각자의 언어로 그려낸 감정의 지형도이다. " +
      "넘쳐흐르는 감정을 억누르기보다 그것이 만들어내는 풍경을 가만히 들여다보고자 한다.",
    artists,
  };
  await fs.mkdir(path.dirname(OUT_JSON), { recursive: true });
  await fs.writeFile(OUT_JSON, JSON.stringify(data, null, 2) + "\n");
  console.log(`wrote ${artists.length} artists`);
}

main();
