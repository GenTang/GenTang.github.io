import type { Metadata } from "next";
import { HomeView } from "../components/HomeView";
import {
  absoluteSiteUrl,
  createPageMetadata,
  homeTitle,
  siteDescription,
  siteName,
} from "../lib/siteMetadata";

const generatedMetadata = createPageMetadata({
  title: homeTitle,
  description: siteDescription,
  path: "/zh/",
  alternatePath: "/en/",
  kind: "website",
  keywords: [
    "小胖笔记",
    "LLM",
    "大语言模型",
    "模型架构",
    "数据基础",
    "工程实现",
    "人工智能",
    "AI",
    "Deep Learning",
  ],
});

export const metadata: Metadata = {
  ...generatedMetadata,
  title: { absolute: homeTitle },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  alternateName: "Xiaopang Notes",
  url: absoluteSiteUrl("/zh/"),
  description: siteDescription,
  inLanguage: ["zh-CN", "en"],
};

export default function ChineseHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeView lang="zh" />
    </>
  );
}
