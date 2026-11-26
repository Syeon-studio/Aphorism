import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 공개 페이지는 정적 생성 + 재검증 (기획서 1장 기술 스택)
  cacheComponents: true,
  partialPrefetching: true,
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
