import Image from "next/image";
import Link from "next/link";
import type { PublicArtist } from "@/types/content";

/** 메인 작가 목록. 열 수 2 / 4 / 4 (8명이 빈칸 없이 나눠떨어지도록). 썸네일은 정사각형(가운데 기준 잘림) */
export default function ArtistGrid({ artists }: { artists: PublicArtist[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-8 tablet:grid-cols-4 tablet:gap-x-6">
      {artists.map((artist) => (
        <li key={artist.slug}>
          <Link href={`/artists/${artist.slug}`} className="group block">
            <div className="relative aspect-square overflow-hidden bg-black/5">
              <Image
                src={artist.profile_image}
                alt={`${artist.name} 대표 작품`}
                fill
                sizes="(min-width: 768px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <p className="mt-3 font-bold group-hover:underline group-hover:underline-offset-4">
              {artist.name}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
