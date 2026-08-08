import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDeconstructingLlmChapterId,
  getDeconstructingLlmRouteChapter,
  getDeconstructingLlmSection,
  getDeconstructingLlmSections,
} from "@/app/lib/deconstructingLlmContent";
import { DeconstructingLlmPage } from "@/app/components/DeconstructingLlmPage";

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

  return section
    ? {
        title: section.title,
        description: `《解构大语言模型：从线性回归到通用智能》${section.title}。`,
      }
    : { title: "小节未找到" };
}

export default async function BookSection({ params }: SectionPageProps) {
  const route = await params;
  const chapterId = getDeconstructingLlmChapterId(route.chapter);
  const section = chapterId ? getDeconstructingLlmSection(chapterId, route.section) : undefined;
  if (!section || section.id === "overview") notFound();

  return <DeconstructingLlmPage section={section} />;
}
