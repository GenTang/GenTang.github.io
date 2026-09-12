import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticRedirect } from "@/app/components/StaticRedirect";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmRouteChapter,
  getDeconstructingLlmSection,
  getDeconstructingLlmSections,
} from "@/app/lib/deconstructingLlmContent";
import { createPageMetadata } from "@/app/lib/siteMetadata";
import { sitePath } from "@/app/lib/sitePath";

type SectionRedirectProps = {
  params: Promise<{ chapter: string; section: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getDeconstructingLlmSections()
    .filter((section) => section.id !== "overview")
    .map((section) => ({
      chapter: getDeconstructingLlmRouteChapter(section.chapterId),
      section: section.id.replaceAll("_", "-"),
    }));
}

export async function generateMetadata({ params }: SectionRedirectProps): Promise<Metadata> {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId
    ? getDeconstructingLlmSection(chapterId, route.section)
    : undefined;
  const path = `/zh/books/deconstructing_LLM/${route.chapter}/${route.section}/`;

  return section
    ? createPageMetadata({
        title: section.title,
        description: section.description,
        path,
        alternatePath: path.replace(/^\/zh\//, "/en/"),
        kind: "website",
      })
    : createPageMetadata({
        title: "章节未找到",
        description: "没有找到请求的章节。",
        path,
        noIndex: true,
      });
}

export default async function LocaleLessBookSectionRedirect({ params }: SectionRedirectProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId
    ? getDeconstructingLlmSection(chapterId, route.section)
    : undefined;
  if (!section) notFound();

  const target = sitePath(`/zh/books/deconstructing_LLM/${route.chapter}/${route.section}/`);

  return (
    <StaticRedirect
      target={target}
      title={section.title}
      message="正在进入中文书稿……"
    />
  );
}
