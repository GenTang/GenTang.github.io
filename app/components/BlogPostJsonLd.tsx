import { absoluteSiteUrl } from "@/app/lib/siteMetadata";
import { JsonLd } from "./JsonLd";

type BlogPostJsonLdProps = {
  lang: "zh" | "en";
  title: string;
  description: string;
  href: string;
  published?: string;
  updated?: string;
  topic: string;
};

export function BlogPostJsonLd({
  lang,
  title,
  description,
  href,
  published,
  updated,
  topic,
}: BlogPostJsonLdProps) {
  const isZh = lang === "zh";
  const homeHref = `/${lang}/`;
  const blogHref = `/${lang}/blog`;
  const aboutHref = `/${lang}/about`;
  const authorName = isZh ? "唐亘" : "Gen Tang";
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${absoluteSiteUrl(href)}#article`,
        headline: title,
        description,
        url: absoluteSiteUrl(href),
        mainEntityOfPage: absoluteSiteUrl(href),
        inLanguage: isZh ? "zh-CN" : "en",
        datePublished: published,
        dateModified: updated ?? published,
        articleSection: topic,
        isAccessibleForFree: true,
        image: absoluteSiteUrl("/og.png"),
        author: {
          "@type": "Person",
          "@id": `${absoluteSiteUrl(aboutHref)}#person`,
          name: authorName,
          url: absoluteSiteUrl(aboutHref),
        },
        publisher: {
          "@type": "Person",
          "@id": `${absoluteSiteUrl(aboutHref)}#person`,
          name: authorName,
          url: absoluteSiteUrl(aboutHref),
        },
        isPartOf: {
          "@type": "Blog",
          "@id": `${absoluteSiteUrl(blogHref)}#blog`,
          name: isZh ? "小胖笔记 AI 技术博客" : "Xiaopang Notes AI Engineering Blog",
          url: absoluteSiteUrl(blogHref),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { name: isZh ? "首页" : "Home", href: homeHref },
          { name: isZh ? "博客" : "Blog", href: blogHref },
          { name: title, href },
        ].map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteSiteUrl(item.href),
        })),
      },
    ],
  };

  return <JsonLd data={data} />;
}
