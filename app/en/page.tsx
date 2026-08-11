import type { Metadata } from "next";
import { HomeView } from "../components/HomeView";
import { createPageMetadata } from "../lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "Xiaopang Notes",
  description: "An online book on large language models, with long-form notes on AI, mathematics, and intelligent systems.",
  path: "/en/",
  alternatePath: "/zh/",
  locale: "en_US",
  kind: "website",
});

export default function EnglishHome() {
  return <HomeView lang="en" />;
}
