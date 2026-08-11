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

const language = "en";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDeconstructingLlmSections(undefined, language)
    .filter((section) => section.id !== "overview")
    .map((section) => ({
      chapter: getDeconstructingLlmRouteChapter(section.chapterId),
      section: section.id.replaceAll("_", "-"),
    }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId
    ? getDeconstructingLlmSection(chapterId, route.section, language)
    : undefined;
  const chapterSeo = chapterId
    ? getDeconstructingLlmChapterSeo(chapterId, language)
    : undefined;
  const alternateSection = chapterId
    ? getDeconstructingLlmSection(chapterId, route.section)
    : undefined;

  return section
    ? createPageMetadata({
        title: section.title,
        description: section.description,
        path: section.href,
        keywords: chapterSeo?.keywords,
        locale: "en_US",
        alternatePath: alternateSection?.href,
      })
    : createPageMetadata({
        title: "Section not found",
        description: "The requested section could not be found.",
        path: `/en/books/deconstructing_LLM/${route.chapter}/${route.section}`,
        locale: "en_US",
        noIndex: true,
      });
}

export default async function EnglishBookSection({ params }: SectionPageProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId
    ? getDeconstructingLlmSection(chapterId, route.section, language)
    : undefined;
  if (!section || section.id === "overview") notFound();

  return <DeconstructingLlmPage section={section} language={language} />;
}
