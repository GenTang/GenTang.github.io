import type { Metadata } from "next";
import { SearchPage } from "@/app/components/SearchPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "Search",
  description: "Search the books, chapters, and essays on Xiaopang Notes.",
  path: "/en/search",
  alternatePath: "/zh/search",
  locale: "en_US",
  kind: "website",
  noIndex: true,
});

export default function Search() {
  return <SearchPage lang="en" />;
}
