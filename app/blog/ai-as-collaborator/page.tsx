import type { Metadata } from "next";
import { getMarkdownContent } from "@/app/lib/content";
import { ReadingPage } from "../../components/ReadingPage";

const source = getMarkdownContent("/content/zh/blog/ai-as-collaborator.md");

export const metadata: Metadata = {
  title: "敬请期待",
  description: "第一篇博客正在写作中，敬请期待。",
};

export default function FirstBlogPost() {
  return (
    <ReadingPage
      lang="zh"
      kind="blog"
      source={source}
      article={{
        kicker: "BLOG · TODO",
        title: "第一篇文章正在写作中，敬请期待",
        summary: "关于人工智能前沿的个人观察与长期思考，正在整理中。",
        readingTime: "正在写作",
        date: "TODO",
        outline: [{ href: "#敬请期待", label: "敬请期待" }],
        showDraftNotice: false,
      }}
    />
  );
}
