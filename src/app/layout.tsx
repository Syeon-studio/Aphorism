import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "@/components/Footer";
import { getSettings } from "@/lib/data";
import { COPYRIGHT_HOLDER } from "@/lib/exhibition";
import { formatPeriod } from "@/lib/format";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

// TODO(5단계): 최종 디자인에 맞춰 폰트 확정
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.exhibition_title;
  const description = `${formatPeriod(settings)} · ${settings.venue}`;
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s | ${title}` },
    description,
    authors: [{ name: COPYRIGHT_HOLDER }],
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: title,
      title,
      description,
      // TODO(5단계): public/og.png (1200×630) 추가
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Footer />
      </body>
    </html>
  );
}
