import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmSection,
  getDeconstructingLlmRouteChapter,
} from "@/app/lib/deconstructingLlmContent";
import { DeconstructingLlmPage } from "@/app/components/DeconstructingLlmPage";
import { createPageMetadata } from "@/app/lib/siteMetadata";

type ChapterPageProps = {
  params: Promise<{ chapter: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getDeconstructingLlmNavigation().chapters
    .filter((chapter) => chapter.href)
    .map((chapter) => ({ chapter: getDeconstructingLlmRouteChapter(chapter.id) }));
}

export async function generateMetadata({ params }: ChapterPageProps): Promise<Metadata> {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId ? getDeconstructingLlmSection(chapterId) : undefined;

  return overview
    ? createPageMetadata({
        title: overview.title,
        description: overview.description,
        path: overview.href,
        alternatePath: chapterId === "chapter_1"
          ? "/en/books/deconstructing_LLM/chapter-1"
          : undefined,
      })
    : createPageMetadata({
        title: "章节未找到",
        description: "没有找到请求的章节。",
        path: `/books/deconstructing_LLM/${route.chapter}`,
        noIndex: true,
      });
}

export default async function BookChapter({ params }: ChapterPageProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId ? getDeconstructingLlmSection(chapterId) : undefined;
  if (!overview) notFound();

  return <DeconstructingLlmPage section={overview} />;
}
