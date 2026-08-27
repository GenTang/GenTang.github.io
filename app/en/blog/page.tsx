import type { Metadata } from "next";
import enContent from "@/content/en/site.json";
import { BlogIndexPage } from "@/app/components/BlogIndexPage";
import { JsonLd } from "@/app/components/JsonLd";
import { getBlogPosts } from "@/app/lib/content";
import { absoluteSiteUrl, createPageMetadata } from "@/app/lib/siteMetadata";

const posts = getBlogPosts("en");

export const metadata: Metadata = createPageMetadata({
  title: "LLM Engineering: Watermarking, Models, and Code",
  description: enContent.essay.sectionDescription,
  path: "/en/blog",
  alternatePath: "/zh/blog",
  locale: "en_US",
  kind: "website",
  noIndex: posts.length === 0,
  keywords: ["AI engineering blog", "LLM", "text watermarking", "deep learning", "model implementation", "Python"],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Blog",
  "@id": `${absoluteSiteUrl("/en/blog")}#blog`,
  url: absoluteSiteUrl("/en/blog"),
  name: "Xiaopang Notes AI Engineering Blog",
  description: enContent.essay.sectionDescription,
  inLanguage: "en",
  author: {
    "@type": "Person",
    name: "Gen Tang",
    url: absoluteSiteUrl("/en/about"),
  },
  blogPost: posts.map((post) => ({
    "@type": "BlogPosting",
    headline: post.title,
    url: absoluteSiteUrl(post.href),
    datePublished: post.published,
    dateModified: post.updated,
  })),
};

export default function EnglishBlogIndex() {
  return (
    <>
      <JsonLd data={structuredData} />
      <BlogIndexPage lang="en" />
    </>
  );
}
