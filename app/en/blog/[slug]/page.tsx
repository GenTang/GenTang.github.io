import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReadingPage } from "@/app/components/ReadingPage";
import { BlogPostJsonLd } from "@/app/components/BlogPostJsonLd";
import {
  getBlogImages,
  getBlogPost,
  getBlogPosts,
  getMarkdownContent,
  getMarkdownOutline,
  withoutLeadingMarkdownTitle,
} from "@/app/lib/content";
import { createPageMetadata } from "@/app/lib/siteMetadata";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getBlogPosts("en").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost("en", slug);
  const alternate = getBlogPost("zh", slug);

  return post
    ? createPageMetadata({
        title: post.seoTitle,
        description: post.seoDescription,
        path: post.href,
        alternatePath: alternate?.href,
        locale: "en_US",
        keywords: [post.topic, "artificial intelligence", "LLM", "technical blog"],
        publishedTime: post.published,
        modifiedTime: post.updated,
      })
    : createPageMetadata({
        title: "Article not found",
        description: "The requested blog article could not be found.",
        path: `/en/blog/${slug}`,
        locale: "en_US",
        noIndex: true,
      });
}

export default async function EnglishBlogPost({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = getBlogPost("en", slug);
  if (!post) notFound();

  const alternate = getBlogPost("zh", slug);
  const markdown = getMarkdownContent(post.contentPath);
  const source = withoutLeadingMarkdownTitle(markdown);

  return (
    <>
      <BlogPostJsonLd
        lang="en"
        title={post.title}
        description={post.seoDescription}
        href={post.href}
        published={post.published}
        updated={post.updated}
        topic={post.topic}
      />
      <ReadingPage
        lang="en"
        kind="blog"
        source={source}
        images={getBlogImages("en", slug)}
        languageHref={alternate?.href ?? "/zh/blog"}
        article={{
          title: post.title,
          summary: post.summary,
          readingTime: `About ${post.readingMinutes} minutes`,
          date: post.date,
          outline: getMarkdownOutline(source),
          showDraftNotice: false,
          showComments: true,
          showEndmark: false,
        }}
      />
    </>
  );
}
