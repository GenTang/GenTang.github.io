import type { Metadata } from "next";
import zhContent from "@/content/zh/site.json";
import { BlogIndexPage } from "@/app/components/BlogIndexPage";
import { JsonLd } from "@/app/components/JsonLd";
import { getBlogPosts } from "@/app/lib/content";
import { absoluteSiteUrl, createPageMetadata } from "@/app/lib/siteMetadata";

const posts = getBlogPosts("zh");

export const metadata: Metadata = createPageMetadata({
  title: "AI 技术博客：LLM、文本水印与模型实现",
  description: zhContent.essay.sectionDescription,
  path: "/zh/blog",
  alternatePath: "/en/blog",
  kind: "website",
  noIndex: posts.length === 0,
  keywords: ["AI 技术博客", "LLM", "分词器", "文本水印", "统计检测", "模型实现", "Python"],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": `${absoluteSiteUrl("/zh/blog")}#blog`,
  url: absoluteSiteUrl("/zh/blog"),
  name: "小胖笔记 AI 技术博客",
  description: zhContent.essay.sectionDescription,
  inLanguage: "zh-CN",
  author: {
    "@type": "Person",
    name: "唐亘",
    url: absoluteSiteUrl("/zh/about"),
  },
  blogPost: posts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    url: absoluteSiteUrl(post.href),
    datePublished: post.published,
    dateModified: post.updated,
  })),
};

export default function ChineseBlogIndex() {
  return (
    <>
      <JsonLd data={structuredData} />
      <BlogIndexPage lang="zh" />
    </>
  );
}
