import type { NextConfig } from "next";

// Supabase Storage 공개 이미지 (SUPABASE_URL이 있을 때만 허용)
const supabaseUrl = process.env.SUPABASE_URL?.trim() ? new URL(process.env.SUPABASE_URL.trim()) : null;

const nextConfig: NextConfig = {
  // 공개 페이지는 정적 생성 + 재검증 (기획서 1장 기술 스택)
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: supabaseUrl.protocol === "http:" ? "http" : "https",
            hostname: supabaseUrl.hostname,
            port: supabaseUrl.port,
            pathname: "/storage/v1/object/public/images/**",
          },
        ]
      : [],
    // 로컬 테스트(Supabase 흉내 서버가 localhost)일 때만 사설 IP 이미지 허용
    dangerouslyAllowLocalIP: supabaseUrl?.hostname === "localhost",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // AI 학습 거부 의사 표시 (비표준·권고. robots.txt 보조용)
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noai, noimageai" }],
      },
      {
        // 편집·관리 화면은 검색 노출 금지
        source: "/(edit|admin|api)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noai, noimageai" }],
      },
    ];
  },
};

export default nextConfig;
