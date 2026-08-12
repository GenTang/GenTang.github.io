import type { Metadata } from "next";
import { sitePath } from "./sitePath";

export const siteName = "小胖笔记";
export const homeTitle = "小胖笔记｜LLM技术笔记：模型架构、数据基础和工程实现";
export const siteDescription = "《解构大语言模型》：从线性回归一路走向LLM；记录 AI、数学与智能系统的长期笔记。";
export const englishHomeTitle = "Xiaopang Notes | LLM Technical Notes: Model Architectures, Data Foundations, and Engineering Implementation";
export const englishSiteDescription = "Deconstructing Large Language Models: from linear regression to LLMs, with long-form notes on AI, mathematics, and intelligent systems.";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://gentang.github.io/";
export const siteUrl = new URL(configuredSiteUrl.endsWith("/") ? configuredSiteUrl : `${configuredSiteUrl}/`);

export function absoluteSiteUrl(path = "/") {
  return new URL(sitePath(path), siteUrl.origin).toString();
}

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
  locale?: "zh_CN" | "en_US";
  alternatePath?: string;
  kind?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
};

export function createPageMetadata({
  title,
  description,
  path,
  locale = "zh_CN",
  alternatePath,
  kind = "article",
  noIndex = false,
  keywords,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteSiteUrl(path);
  const image = absoluteSiteUrl("/og.png");
  const languages = alternatePath
    ? locale === "zh_CN"
      ? { "zh-CN": canonical, en: absoluteSiteUrl(alternatePath), "x-default": canonical }
      : { en: canonical, "zh-CN": absoluteSiteUrl(alternatePath), "x-default": absoluteSiteUrl(alternatePath) }
    : undefined;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
      languages,
    },
    robots: noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName,
      type: kind,
      locale,
      images: [{ url: image, width: 1728, height: 910, alt: `${title} · ${siteName}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
