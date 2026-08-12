import type { Metadata } from "next";
import { getMarkdownContent, getMarkdownMetadata } from "@/app/lib/content";
import { ReadingPage } from "../../../components/ReadingPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const source = getMarkdownContent("/content/en/blog/ai-as-collaborator.md");
const dates = getMarkdownMetadata("/content/en/blog/ai-as-collaborator.md");

export const metadata: Metadata = createPageMetadata({
  title: "Coming soon",
  description: "The first blog post is in progress. Please check back soon.",
  path: "/en/blog/ai-as-collaborator",
  alternatePath: "/zh/blog/ai-as-collaborator",
  locale: "en_US",
  noIndex: true,
  publishedTime: dates.published,
  modifiedTime: dates.updated,
});

export default function EnglishFirstBlogPost() {
  return (
    <ReadingPage
      lang="en"
      kind="blog"
      source={source}
      article={{
        kicker: "BLOG · TODO",
        title: "The first essay is in progress — coming soon",
        summary: "Long-form observations on the frontiers of artificial intelligence are being prepared.",
        readingTime: "In progress",
        date: dates.published ?? "TODO",
        outline: [{ href: "#coming-soon", label: "Coming soon" }],
        showDraftNotice: false,
      }}
    />
  );
}
