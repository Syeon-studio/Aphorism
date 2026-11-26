import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Footer from "@/components/Footer";
import { COPYRIGHT_HOLDER, EXHIBITION } from "@/lib/exhibition";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

// TODO(5단계): 최종 디자인에 맞춰 폰트 확정
const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const description = `${EXHIBITION.periodLabel} · ${EXHIBITION.venue}`;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: EXHIBITION.title,
    template: `%s | ${EXHIBITION.title}`,
  },
  description,
  authors: [{ name: COPYRIGHT_HOLDER }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: EXHIBITION.title,
    title: EXHIBITION.title,
    description,
    // TODO(5단계): public/og.png (1200×630) 추가
  },
};

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
