import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { sitePath } from "./lib/sitePath";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteUrl = new URL(configuredSiteUrl);
const socialImage = new URL(sitePath("/og.png"), siteUrl.origin).toString();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "小胖笔记",
    template: "%s · 小胖笔记",
  },
  description: "两本持续更新的书，以及关于人工智能前沿的长期笔记。",
  openGraph: {
    title: "小胖笔记",
    description: "两本持续更新的书，以及关于人工智能前沿的长期笔记。",
    type: "website",
    locale: "zh_CN",
    images: [{ url: socialImage, width: 1728, height: 910, alt: "小胖笔记" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "小胖笔记",
    description: "两本持续更新的书，以及关于人工智能前沿的长期笔记。",
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
