import type { Metadata } from "next";
import { HomeView } from "./components/HomeView";
import { createPageMetadata, siteDescription } from "./lib/siteMetadata";

export const metadata: Metadata = createPageMetadata({
  title: "小胖笔记",
  description: siteDescription,
  path: "/",
  alternatePath: "/en/",
  kind: "website",
});

export default function Home() {
  return <HomeView lang="zh" />;
}
