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

const contentPath = "/content/zh/blog/watermarking_on_aigc_2/watermarking_on_aigc_2.md";
const markdown = getMarkdownContent(contentPath);
const title = getMarkdownTitle(markdown);
const contentMetadata = getMarkdownMetadata(contentPath);
const description = contentMetadata.summary ?? getMarkdownDescription(markdown);
const source = withoutLeadingMarkdownTitle(markdown);
const images = getBlogImages("zh", "watermarking_on_aigc_2");
const outline = getMarkdownOutline(source);

export const metadata: Metadata = createPageMetadata({
  title,
  description,
  path: "/zh/blog/watermarking_on_aigc_2",
  keywords: ["文本水印", "SynthID-Text", "Tournament Sampling", "Weighted Mean", "KGW", "LLM"],
  publishedTime: contentMetadata.published,
  modifiedTime: contentMetadata.updated,
});

export default function SynthIdTextWatermarking() {
  return (
    <ReadingPage
      lang="zh"
      kind="blog"
      source={source}
      images={images}
      article={{
        title,
        summary: contentMetadata.summary,
        readingTime: "约 25 分钟阅读",
        date: contentMetadata.published ?? "2026-08-18",
        outline,
        showDraftNotice: false,
        showComments: true,
        showEndmark: false,
      }}
    />
  );
}
