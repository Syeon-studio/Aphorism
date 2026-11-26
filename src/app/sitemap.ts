import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

// TODO(1단계): 작가 상세 페이지(/artists/[slug])를 데이터에서 읽어 추가
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${getSiteUrl()}/` }];
}
