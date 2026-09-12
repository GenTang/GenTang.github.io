import type { Metadata } from "next";
import { sitePath } from "./sitePath";

export const siteName = "小胖笔记";
export const englishSiteName = "Xiaopang Notes";
export const homeTitle = "小胖笔记｜大语言模型（LLM）技术笔记：架构、数据与工程实现";
export const siteDescription = "小胖笔记：在线阅读《解构大语言模型》，并提供 LLM 技术博客。覆盖分词器、文本水印、Transformer、GPT、RLHF，以及从线性回归到深度学习的数学推导、可复现实验与 Python Notebook。";
export const englishHomeTitle = "Xiaopang Notes | LLM Technical Notes: Architecture, Data, Engineering";
export const englishSiteDescription = "Xiaopang Notes: read Deconstructing Large Language Models online and technical essays on tokenizers, text watermarking, Transformers, GPT, and RLHF—with math derivations, reproducible experiments, and Python notebooks.";
export const authorName = "唐亘";
export const englishAuthorName = "Gen Tang";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://gentang.github.io/";
export const siteUrl = new URL(configuredSiteUrl.endsWith("/") ? configuredSiteUrl : `${configuredSiteUrl}/`);

export function absoluteSiteUrl(path = "/") {
  return new URL(sitePath(path), siteUrl.origin).toString();
}

function plainMetadataText(value: string) {
  return value
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function conciseMetadataText(value: string, maximumLength: number) {
  if (value.length <= maximumLength) return value;

  const shortened = value.slice(0, maximumLength + 1);
  const boundary = shortened.lastIndexOf(" ");
  const end = boundary >= maximumLength * 0.72 ? boundary : maximumLength;
  return `${shortened.slice(0, end).replace(/[，。；、,:;\s]+$/u, "")}…`;
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
  publishedTime?: string;
  modifiedTime?: string;
  imagePath?: string;
  imageAlt?: string;
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
  publishedTime,
  modifiedTime,
  imagePath = "/og.png",
  imageAlt,
}: PageMetadataOptions): Metadata {
  const normalizedTitle = plainMetadataText(title);
  const normalizedDescription = conciseMetadataText(
    plainMetadataText(description),
    locale === "en_US" ? 165 : 120,
  );
  const conciseTitle = conciseMetadataText(normalizedTitle, locale === "en_US" ? 68 : 46);
  const canonical = absoluteSiteUrl(path);
  const image = absoluteSiteUrl(imagePath);
  const localizedSiteName = locale === "en_US" ? englishSiteName : siteName;
  const localizedAuthorName = locale === "en_US" ? englishAuthorName : authorName;
  const authorUrl = absoluteSiteUrl(locale === "en_US" ? "/en/about" : "/zh/about");
  const alternateLocale = alternatePath ? (locale === "zh_CN" ? "en_US" : "zh_CN") : undefined;
  const socialImage = imagePath === "/og.png"
    ? { url: image, width: 1728, height: 910, alt: imageAlt ?? `${conciseTitle} · ${localizedSiteName}` }
    : { url: image, alt: imageAlt ?? conciseTitle };
  const brandedTitle = `${conciseTitle} · ${localizedSiteName}`;
  const documentTitle = conciseTitle === localizedSiteName
    ? conciseTitle
    : brandedTitle.length <= (locale === "en_US" ? 72 : 46)
      ? brandedTitle
      : conciseTitle;
  const languages = alternatePath
    ? locale === "zh_CN"
      ? { "zh-CN": canonical, en: absoluteSiteUrl(alternatePath), "x-default": canonical }
      : { en: canonical, "zh-CN": absoluteSiteUrl(alternatePath), "x-default": absoluteSiteUrl(alternatePath) }
    : undefined;

  const openGraph = kind === "article"
    ? {
        title: conciseTitle,
        description: normalizedDescription,
        url: canonical,
        siteName: localizedSiteName,
        type: "article" as const,
        locale,
        alternateLocale,
        publishedTime,
        modifiedTime,
        authors: [authorUrl],
        images: [socialImage],
      }
    : {
        title: conciseTitle,
        description: normalizedDescription,
        url: canonical,
        siteName: localizedSiteName,
        type: "website" as const,
        locale,
        alternateLocale,
        images: [socialImage],
      };

  return {
    title: { absolute: documentTitle },
    description: normalizedDescription,
    keywords,
    authors: [{ name: localizedAuthorName, url: authorUrl }],
    creator: localizedAuthorName,
    publisher: localizedAuthorName,
    category: kind === "article" ? (locale === "en_US" ? "Artificial Intelligence" : "人工智能") : undefined,
    alternates: {
      canonical,
      languages,
    },
    robots: noIndex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: conciseTitle,
      description: normalizedDescription,
      images: [image],
    },
  };
}
