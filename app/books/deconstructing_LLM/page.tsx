import type { Metadata } from "next";
import { StaticRedirect } from "@/app/components/StaticRedirect";
import { createPageMetadata, siteDescription } from "@/app/lib/siteMetadata";
import { sitePath } from "@/app/lib/sitePath";

const targetPath = "/zh/books/deconstructing_LLM/";

export const metadata: Metadata = createPageMetadata({
  title: "解构大语言模型",
  description: siteDescription,
  path: targetPath,
  alternatePath: "/en/books/deconstructing_LLM/",
  kind: "website",
});

export default function LocaleLessBookOverviewRedirect() {
  const target = sitePath(targetPath);

  return (
    <StaticRedirect
      target={target}
      title="解构大语言模型"
      message="正在进入中文书稿……"
    />
  );
}
