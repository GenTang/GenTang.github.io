import type { Metadata } from "next";
import enContent from "@/content/en/site.json";
import { BlogIndexPage } from "@/app/components/BlogIndexPage";
import { getBlogPosts } from "@/app/lib/content";
import { createPageMetadata } from "@/app/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "AI Engineering Blog: LLMs, Watermarking, and Model Implementation",
  description: enContent.essay.sectionDescription,
  path: "/en/blog",
  alternatePath: "/zh/blog",
  locale: "en_US",
  kind: "website",
  noIndex: getBlogPosts("en").length === 0,
});

export default function EnglishBlogIndex() {
  return <BlogIndexPage lang="en" />;
}
