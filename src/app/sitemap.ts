import type { MetadataRoute } from "next";
import { getArtists } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const artists = await getArtists();
  return [
    { url: `${base}/` },
    ...artists.map((a) => ({ url: `${base}/artists/${a.slug}` })),
  ];
}
