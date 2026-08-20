import type { Metadata } from "next";
import enContent from "@/content/en/site.json";
import { BlogIndexPage } from "@/app/components/BlogIndexPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "Blog",
  description: enContent.essay.sectionDescription,
  path: "/en/blog",
  alternatePath: "/zh/blog",
  locale: "en_US",
  kind: "website",
  noIndex: !enContent.essay.posts.some((post) => post.available),
});

export default function EnglishBlogIndex() {
  return <BlogIndexPage lang="en" />;
}
