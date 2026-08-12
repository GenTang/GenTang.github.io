import type { Metadata } from "next";
import { AboutPage } from "@/app/components/AboutPage";
import { getMarkdownContent } from "@/app/lib/content";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const source = getMarkdownContent("/content/en/about.md");

export const metadata: Metadata = createPageMetadata({
  title: "About Gen Tang",
  description: "Gen Tang is a data scientist and the author of Mastering Data Science and Deconstructing Large Language Models.",
  path: "/en/about",
  alternatePath: "/zh/about",
  locale: "en_US",
  kind: "website",
  keywords: ["Gen Tang", "data scientist", "artificial intelligence", "big data", "large language models"],
});

export default function About() {
  return <AboutPage lang="en" source={source} />;
}
