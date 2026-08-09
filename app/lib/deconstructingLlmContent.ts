import bookConfig from "@/content/zh/books/deconstructing_LLM/book.json";
import { bookChapterIds, markdownContent } from "./content";

export type BookSection = {
  id: string;
  chapterId: string;
  title: string;
  href: string;
  source: string;
};

export type BookNavigation = {
  title: string;
  subtitle?: string;
  chapters: Array<{
    id: string;
    title: string;
    href?: string;
    sections: Array<Pick<BookSection, "id" | "title" | "href">>;
  }>;
};

const markdownModules = Object.fromEntries(
  Object.entries(markdownContent).filter(([path]) =>
    /^\/content\/zh\/books\/deconstructing_LLM\/chapter_\d+\/[^/]+\.md$/.test(path)
  ),
) as Record<string, string>;

function headingTitle(source: string, fallback: string) {
  const heading = source.match(/^#{1,6}\s+(.+?)\s*$/m)?.[1];

  return heading
    ?.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim() || fallback;
}

function sectionOrder(sectionId: string) {
  return sectionId === "overview" ? "0" : sectionId;
}

function chapterFallbackTitle(chapterId: string) {
  const configuredTitles = bookConfig.chapterTitles as Record<string, string>;
  if (configuredTitles[chapterId]) return configuredTitles[chapterId];

  const chapterNumber = Number(chapterId.match(/\d+$/)?.[0]);
  return Number.isFinite(chapterNumber) ? `第 ${chapterNumber} 章` : chapterId;
}

const sections: BookSection[] = Object.entries(markdownModules)
  .flatMap(([path, source]) => {
    const match = path.match(/\/(chapter_(\d+))\/([^/]+)\.md$/);
    if (!match) return [];

    const [, chapterId, chapterNumber, sectionId] = match;
    const chapterHref = `/books/deconstructing_LLM/chapter-${chapterNumber}`;
    const routeSegment = sectionId === "overview" ? "" : `/${sectionId.replaceAll("_", "-")}`;
    const fallbackTitle = sectionId === "overview" ? `第 ${chapterNumber} 章` : sectionId.replaceAll("_", ".");

    return [{
      id: sectionId,
      chapterId,
      title: headingTitle(source, fallbackTitle),
      href: `${chapterHref}${routeSegment}`,
      source,
    }];
  })
  .sort((left, right) => {
    const chapterComparison = left.chapterId.localeCompare(right.chapterId, "zh-CN", { numeric: true });
    if (chapterComparison !== 0) return chapterComparison;

    return sectionOrder(left.id).localeCompare(sectionOrder(right.id), "zh-CN", { numeric: true });
  });

export function getDeconstructingLlmSections(chapterId?: string) {
  return chapterId ? sections.filter((section) => section.chapterId === chapterId) : sections;
}

export function getDeconstructingLlmSection(chapterId: string, routeSection = "overview") {
  const sectionId = decodeURIComponent(routeSection).replaceAll("-", "_");
  return sections.find((section) => section.chapterId === chapterId && section.id === sectionId);
}

export function getDeconstructingLlmChapterId(routeChapter: string) {
  const match = decodeURIComponent(routeChapter).match(/^chapter-(\d+)$/);
  return match ? `chapter_${match[1]}` : undefined;
}

export function getDeconstructingLlmRouteChapter(chapterId: string) {
  return chapterId.replace("chapter_", "chapter-");
}

export function getDeconstructingLlmNavigation(): BookNavigation {
  return {
    title: bookConfig.title,
    subtitle: bookConfig.subtitle,
    chapters: bookChapterIds.map((chapterId) => {
      const chapterSections = getDeconstructingLlmSections(chapterId);
      const chapterOverview = chapterSections.find((section) => section.id === "overview");

      return {
        id: chapterId,
        title: chapterOverview
          ? headingTitle(chapterOverview.source, chapterFallbackTitle(chapterId))
          : chapterFallbackTitle(chapterId),
        href: chapterOverview?.href,
        sections: chapterSections
          .filter((section) => section.id !== "overview")
          .map(({ id, title, href }) => ({ id, title, href })),
      };
    }),
  };
}

export function getDeconstructingLlmNeighbors(currentHref: string) {
  const currentIndex = sections.findIndex((section) => section.href === currentHref);

  return {
    previousPage: currentIndex > 0 ? sections[currentIndex - 1] : undefined,
    nextPage: currentIndex >= 0 ? sections[currentIndex + 1] : undefined,
  };
}
