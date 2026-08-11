import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmChapterSeo,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmRouteChapter,
  getDeconstructingLlmSection,
} from "@/app/lib/deconstructingLlmContent";
import { DeconstructingLlmPage } from "@/app/components/DeconstructingLlmPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

type ChapterPageProps = {
  params: Promise<{ chapter: string }>;
};

const language = "en";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDeconstructingLlmNavigation(language).chapters
    .filter((chapter) => chapter.href)
    .map((chapter) => ({ chapter: getDeconstructingLlmRouteChapter(chapter.id) }));
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId
    ? getDeconstructingLlmSection(chapterId, "overview", language)
    : undefined;
  const chapterSeo = chapterId
    ? getDeconstructingLlmChapterSeo(chapterId, language)
    : undefined;
  const alternateSection = chapterId
    ? getDeconstructingLlmSection(chapterId)
    : undefined;

  return overview
    ? createPageMetadata({
        title: overview.title,
        description: chapterSeo?.description || overview.description,
        path: overview.href,
        keywords: chapterSeo?.keywords,
        locale: "en_US",
        alternatePath: alternateSection?.href,
      })
    : createPageMetadata({
        title: "Chapter not found",
        description: "The requested chapter could not be found.",
        path: `/en/books/deconstructing_LLM/${route.chapter}`,
        locale: "en_US",
        noIndex: true,
      });
}

export default async function EnglishBookChapter({ params }: ChapterPageProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId
    ? getDeconstructingLlmSection(chapterId, "overview", language)
    : undefined;
  if (!overview) notFound();

  return <DeconstructingLlmPage section={overview} language={language} />;
}
