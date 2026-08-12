import type { Metadata } from "next";
import { SearchPage } from "@/app/components/SearchPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "站内搜索",
  description: "搜索小胖笔记的书稿、章节和博客内容。",
  path: "/zh/search",
  alternatePath: "/en/search",
  kind: "website",
  noIndex: true,
});

export default function Search() {
  return <SearchPage lang="zh" />;
}
