import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaticRedirect } from "@/app/components/StaticRedirect";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmRouteChapter,
  getDeconstructingLlmSection,
} from "@/app/lib/deconstructingLlmContent";
import { createPageMetadata } from "@/app/lib/siteMetadata";
import { sitePath } from "@/app/lib/sitePath";

type ChapterRedirectProps = {
  params: Promise<{ chapter: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return getDeconstructingLlmNavigation().chapters
    .filter((chapter) => chapter.href)
    .map((chapter) => ({ chapter: getDeconstructingLlmRouteChapter(chapter.id) }));
}

export async function generateMetadata({ params }: ChapterRedirectProps): Promise<Metadata> {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId ? getDeconstructingLlmSection(chapterId) : undefined;
  const path = `/zh/books/deconstructing_LLM/${route.chapter}/`;

  return overview
    ? createPageMetadata({
        title: overview.title,
        description: overview.description,
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

export default async function LocaleLessBookChapterRedirect({ params }: ChapterRedirectProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId ? getDeconstructingLlmSection(chapterId) : undefined;
  if (!overview) notFound();

  const target = sitePath(`/zh/books/deconstructing_LLM/${route.chapter}/`);

  return (
    <StaticRedirect
      target={target}
      title={overview.title}
      message="正在进入中文书稿……"
    />
  );
}
