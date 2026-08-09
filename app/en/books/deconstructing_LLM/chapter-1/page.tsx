import type { Metadata } from "next";
import { ReadingPage } from "@/app/components/ReadingPage";
import { getMarkdownContent } from "@/app/lib/content";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const source = getMarkdownContent("/content/en/books/ai-systems/chapter-1.md");

export const metadata: Metadata = createPageMetadata({
  title: "Chapter 1: Begin with the question",
  description: "Chapter one of Notes on AI Systems: before discussing models, decide what problem intelligence is being asked to solve.",
  path: "/en/books/deconstructing_LLM/chapter-1",
  alternatePath: "/books/deconstructing_LLM/chapter-1",
  locale: "en_US",
});

export default function EnglishChapterOne() {
  return (
    <ReadingPage
      lang="en"
      kind="book"
      source={source}
      article={{
        kicker: "BOOK 01 · CHAPTER 01",
        title: "Begin with the question",
        summary: "Before discussing models, parameters, or agents, we need to decide what problem intelligence is actually being asked to solve.",
        readingTime: "12 min read",
        date: "2026.08.07",
      }}
    />
  );
}
