import type { Metadata } from "next";
import {
  getBlogImages,
  getMarkdownDescription,
  getMarkdownOutline,
  getMarkdownContent,
  getMarkdownMetadata,
  getMarkdownTitle,
  withoutLeadingMarkdownTitle,
} from "@/app/lib/content";
import { ReadingPage } from "@/app/components/ReadingPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const contentPath = "/content/en/blog/watermarking_on_aigc/watermarking_on_aigc.md";
const markdown = getMarkdownContent(contentPath);
const title = getMarkdownTitle(markdown);
const contentMetadata = getMarkdownMetadata(contentPath);
const description = contentMetadata.summary ?? getMarkdownDescription(markdown);
const source = withoutLeadingMarkdownTitle(markdown);
const images = getBlogImages("en", "watermarking_on_aigc");
const outline = getMarkdownOutline(source);

export const metadata: Metadata = createPageMetadata({
  title,
  description,
  path: "/en/blog/watermarking_on_aigc",
  alternatePath: "/zh/blog/watermarking_on_aigc",
  locale: "en_US",
  keywords: ["text watermarking", "KGW", "DeepSeek", "LLM", "AIGC detection", "z-score"],
  publishedTime: contentMetadata.published,
  modifiedTime: contentMetadata.updated,
});

export default function WatermarkingOnAigc() {
  return (
    <ReadingPage
      lang="en"
      kind="blog"
      source={source}
      images={images}
      languageHref="/zh/blog/watermarking_on_aigc"
      article={{
        title,
        summary: contentMetadata.summary,
        readingTime: "About 15 minutes",
        date: contentMetadata.published ?? "2026-08-17",
        outline,
        showDraftNotice: false,
        showComments: true,
        showEndmark: false,
      }}
    />
  );
}
