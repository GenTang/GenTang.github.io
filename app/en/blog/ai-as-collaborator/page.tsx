import type { Metadata } from "next";
import { getMarkdownContent } from "@/app/lib/content";
import { ReadingPage } from "../../../components/ReadingPage";

const source = getMarkdownContent("/content/en/blog/ai-as-collaborator.md");

export const metadata: Metadata = {
  title: "From tool to collaborator",
  description: "The important change in AI is not only faster answers, but a moving boundary between tool use and collaboration.",
};

export default function EnglishFirstBlogPost() {
  return (
    <ReadingPage
      lang="en"
      kind="blog"
      source={source}
      article={{
        kicker: "AI ESSAY · 001",
        title: "From tool to collaborator: how I think about AI today",
        summary: "The most important change in AI is not that answers became faster. It is that the boundary between using a tool and working with a system has begun to move.",
        readingTime: "8 min read",
        date: "2026.08.07",
      }}
    />
  );
}
