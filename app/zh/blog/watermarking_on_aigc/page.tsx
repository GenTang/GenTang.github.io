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

const contentPath = "/content/zh/blog/watermarking_on_aigc/watermarking_on_aigc.md";
const markdown = getMarkdownContent(contentPath);
const title = getMarkdownTitle(markdown);
const description = getMarkdownDescription(markdown);
const source = withoutLeadingMarkdownTitle(markdown);
const dates = getMarkdownMetadata(contentPath);
const images = getBlogImages("zh", "watermarking_on_aigc");
const outline = getMarkdownOutline(source);

export const metadata: Metadata = createPageMetadata({
  title,
  description,
  path: "/zh/blog/watermarking_on_aigc",
  keywords: ["文字水印", "KGW", "DeepSeek", "LLM", "AIGC检测", "z-score"],
  publishedTime: dates.published,
  modifiedTime: dates.updated,
});

export default function WatermarkingOnAigc() {
  return (
    <ReadingPage
      lang="zh"
      kind="blog"
      source={source}
      images={images}
      languageHref="/en/blog"
      article={{
        title,
        readingTime: "约 15 分钟",
        date: dates.published ?? "2026-08-17",
        outline,
        showDraftNotice: false,
        showComments: true,
        showEndmark: false,
      }}
    />
  );
}
