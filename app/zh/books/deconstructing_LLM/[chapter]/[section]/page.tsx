import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmChapterSeo,
  getDeconstructingLlmRouteChapter,
  getDeconstructingLlmSection,
  getDeconstructingLlmSections,
} from "@/app/lib/deconstructingLlmContent";
import { DeconstructingLlmPage } from "@/app/components/DeconstructingLlmPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

type SectionPageProps = {
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

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId ? getDeconstructingLlmSection(chapterId, route.section) : undefined;
  const chapterSeo = chapterId ? getDeconstructingLlmChapterSeo(chapterId) : undefined;
  const alternateSection = chapterId
    ? getDeconstructingLlmSection(chapterId, route.section, "en")
    : undefined;

  return section
    ? createPageMetadata({
        title: section.title,
        description: section.description,
        path: section.href,
        keywords: chapterSeo?.keywords,
        alternatePath: alternateSection?.href,
      })
    : createPageMetadata({
        title: "小节未找到",
        description: "没有找到请求的小节。",
        path: `/zh/books/deconstructing_LLM/${route.chapter}/${route.section}`,
        noIndex: true,
      });
}

export default async function BookSection({ params }: SectionPageProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId ? getDeconstructingLlmSection(chapterId, route.section) : undefined;
  if (!section || section.id === "overview") notFound();

  return <DeconstructingLlmPage section={section} />;
}
