import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * AI 학습용 크롤러만 차단한다. 일반 검색엔진(Google, Naver, Bing 등)과
 * AI 검색·사용자 요청형 봇(OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
 * Claude-User, PerplexityBot 등)은 허용한다.
 *
 * 주의:
 * - facebookexternalhit(인스타·페북 링크 미리보기), kakaotalk-scrap(카카오톡
 *   미리보기), Twitterbot 등 미리보기 봇은 절대 넣지 말 것.
 * - robots.txt는 권고일 뿐 강제력이 없다. 보조로 next.config.ts에서
 *   X-Robots-Tag: noai, noimageai 헤더를 보낸다.
 */
const AI_TRAINING_BOTS = [
  "GPTBot", // OpenAI 학습
  "ClaudeBot", // Anthropic 학습
  "anthropic-ai", // Anthropic (구 토큰)
  "Google-Extended", // Gemini 학습 (Googlebot 검색에는 영향 없음)
  "Applebot-Extended", // Apple AI 학습 (Applebot 검색에는 영향 없음)
  "CCBot", // Common Crawl
  "Meta-ExternalAgent", // Meta AI 학습
  "FacebookBot", // Meta 음성·AI 학습 (미리보기 봇 아님)
  "Bytespider", // ByteDance
  "Amazonbot", // Amazon
  "cohere-ai",
  "cohere-training-data-crawler",
  "AI2Bot", // Allen Institute
  "Diffbot",
  "Timpibot",
  "webzio-extended",
  "img2dataset", // 이미지 데이터셋 수집
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  return {
    rules: [
      { userAgent: AI_TRAINING_BOTS, disallow: "/" },
      {
        userAgent: "*",
        allow: "/",
        // 편집·관리 화면은 페이지 자체에도 noindex를 건다
        disallow: ["/edit/", "/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
