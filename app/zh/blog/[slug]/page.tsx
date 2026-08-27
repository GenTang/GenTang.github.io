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
  return getBlogPosts("zh").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost("zh", slug);
  const alternate = getBlogPost("en", slug);

  return post
    ? createPageMetadata({
        title: post.seoTitle,
        description: post.seoDescription,
        path: post.href,
        alternatePath: alternate?.href,
        keywords: [post.topic, "人工智能", "LLM", "技术博客"],
        publishedTime: post.published,
        modifiedTime: post.updated,
      })
    : createPageMetadata({
        title: "文章未找到",
        description: "没有找到请求的博客文章。",
        path: `/zh/blog/${slug}`,
        noIndex: true,
      });
}

export default async function ChineseBlogPost({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = getBlogPost("zh", slug);
  if (!post) notFound();

  const alternate = getBlogPost("en", slug);
  const markdown = getMarkdownContent(post.contentPath);
  const source = withoutLeadingMarkdownTitle(markdown);

  return (
    <>
      <BlogPostJsonLd
        lang="zh"
        title={post.title}
        description={post.seoDescription}
        href={post.href}
        published={post.published}
        updated={post.updated}
        topic={post.topic}
      />
      <ReadingPage
        lang="zh"
        kind="blog"
        source={source}
        images={getBlogImages("zh", slug)}
        languageHref={alternate?.href ?? "/en/blog"}
        article={{
          title: post.title,
          summary: post.summary,
          readingTime: `约 ${post.readingMinutes} 分钟阅读`,
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
