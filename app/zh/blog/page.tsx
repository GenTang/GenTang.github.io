import type { Metadata } from "next";
import zhContent from "@/content/zh/site.json";
import { BlogIndexPage } from "@/app/components/BlogIndexPage";
import { getBlogPosts } from "@/app/lib/content";
import { createPageMetadata } from "@/app/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "AI 技术博客：LLM、文本水印与模型实现",
  description: zhContent.essay.sectionDescription,
  path: "/zh/blog",
  alternatePath: "/en/blog",
  kind: "website",
  noIndex: getBlogPosts("zh").length === 0,
});

export default function ChineseBlogIndex() {
  return <BlogIndexPage lang="zh" />;
}
