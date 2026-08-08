import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmSection,
  getDeconstructingLlmRouteChapter,
} from "@/app/lib/deconstructingLlmContent";
import { DeconstructingLlmPage } from "@/app/components/DeconstructingLlmPage";

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
    ? {
        title: overview.title,
        description: `《解构大语言模型：从线性回归到通用智能》${overview.title}。`,
      }
    : { title: "章节未找到" };
}

export default async function BookChapter({ params }: ChapterPageProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const overview = chapterId ? getDeconstructingLlmSection(chapterId) : undefined;
  if (!overview) notFound();

  return <DeconstructingLlmPage section={overview} />;
}
