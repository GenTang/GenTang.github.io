import type { Metadata } from "next";
import { StaticRedirect } from "./components/StaticRedirect";
import { createPageMetadata, siteDescription } from "./lib/siteMetadata";
import { sitePath } from "./lib/sitePath";

export const metadata: Metadata = createPageMetadata({
  title: "小胖笔记",
  description: siteDescription,
  path: "/zh/",
  alternatePath: "/en/",
  kind: "website",
});

export default function LanguageEntry() {
  const target = sitePath("/zh/");

  return (
    <StaticRedirect
      target={target}
      title="小胖笔记"
      message="正在进入中文站点……"
    />
  );
}
