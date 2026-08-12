import type { Metadata } from "next";
import { AboutPage } from "@/app/components/AboutPage";
import { getMarkdownContent } from "@/app/lib/content";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const source = getMarkdownContent("/content/zh/about.md");

export const metadata: Metadata = createPageMetadata({
  title: "关于唐亘",
  description: "唐亘，数据科学家，《精通数据科学》与《解构大语言模型》作者。",
  path: "/zh/about",
  alternatePath: "/en/about",
  kind: "website",
  keywords: ["唐亘", "数据科学家", "人工智能", "大数据", "解构大语言模型"],
});

export default function About() {
  return <AboutPage lang="zh" source={source} />;
}
