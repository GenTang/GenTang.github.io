import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import {
  absoluteSiteUrl,
  siteDescription,
  siteName,
  siteUrl,
} from "./lib/siteMetadata";

const socialImage = absoluteSiteUrl("/og.png");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    title: siteName,
    description: siteDescription,
    type: "website",
    locale: "zh_CN",
    siteName,
    images: [{ url: socialImage, width: 1728, height: 910, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="小胖笔记 RSS" href={absoluteSiteUrl("/rss.xml")} />
        <link rel="alternate" type="application/atom+xml" title="小胖笔记 Atom" href={absoluteSiteUrl("/atom.xml")} />
      </head>
      <body>{children}</body>
    </html>
  );
}
