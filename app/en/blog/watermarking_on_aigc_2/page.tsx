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

const contentPath = "/content/en/blog/watermarking_on_aigc_2/watermarking_on_aigc_2.md";
const markdown = getMarkdownContent(contentPath);
const title = getMarkdownTitle(markdown);
const contentMetadata = getMarkdownMetadata(contentPath);
const description = contentMetadata.summary ?? getMarkdownDescription(markdown);
const source = withoutLeadingMarkdownTitle(markdown);
const images = getBlogImages("en", "watermarking_on_aigc_2");
const outline = getMarkdownOutline(source);

export const metadata: Metadata = createPageMetadata({
  title,
  description,
  path: "/en/blog/watermarking_on_aigc_2",
  alternatePath: "/zh/blog/watermarking_on_aigc_2",
  locale: "en_US",
  keywords: ["text watermarking", "SynthID-Text", "Tournament Sampling", "Weighted Mean", "KGW", "LLM"],
  publishedTime: contentMetadata.published,
  modifiedTime: contentMetadata.updated,
});

export default function SynthIdTextWatermarking() {
  return (
    <ReadingPage
      lang="en"
      kind="blog"
      source={source}
      images={images}
      languageHref="/zh/blog/watermarking_on_aigc_2"
      article={{
        title,
        summary: contentMetadata.summary,
        readingTime: "About 25 minutes",
        date: contentMetadata.published ?? "2026-08-20",
        outline,
        showDraftNotice: false,
        showComments: true,
        showEndmark: false,
      }}
    />
  );
}
