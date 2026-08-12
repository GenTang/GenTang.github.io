import enBookConfig from "@/content/en/books/deconstructing_LLM/book.json";
import zhBookConfig from "@/content/zh/books/deconstructing_LLM/book.json";
import { bookChapterIdsByLanguage, markdownContent, markdownMetadata } from "./content";

export type BookLanguage = "zh" | "en";

export type BookSection = {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  href: string;
  source: string;
  dates: ContentDates;
};

export type ContentDates = {
  published?: string;
  updated?: string;
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

export type BookChapterSeo = {
  description: string;
  keywords: string[];
};

const languages: BookLanguage[] = ["zh", "en"];
const bookConfigs = {
  zh: zhBookConfig,
  en: enBookConfig,
};

function headingTitle(source: string, fallback: string) {
  const heading = source.match(/^#{1,6}\s+(.+?)\s*$/m)?.[1];

  return heading
    ?.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim() || fallback;
}

function markdownDescription(source: string, fallback: string) {
  const paragraphs = source
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/^(?:>\s?.*(?:\n|$))+/gm, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .replace(/^[-*+]\s+/gm, "")
      .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\[\^[^\]]+]/g, "")
      .replace(/\s+/g, " ")
      .trim())
    .filter((paragraph) => paragraph.length >= 18 && !/^[-—–]/.test(paragraph));
  const description = paragraphs[0] || fallback;

  return description.length > 128 ? `${description.slice(0, 125).trimEnd()}…` : description;
}

function sectionOrder(sectionId: string) {
  return sectionId === "overview" ? "0" : sectionId;
}

function chapterFallbackTitle(chapterId: string, language: BookLanguage) {
  const configuredTitles = bookConfigs[language].chapterTitles as Record<string, string>;
  if (configuredTitles[chapterId]) return configuredTitles[chapterId];

  const chapterNumber = Number(chapterId.match(/\d+$/)?.[0]);
  if (!Number.isFinite(chapterNumber)) return chapterId;

  return language === "zh" ? `第 ${chapterNumber} 章` : `Chapter ${chapterNumber}`;
}

function buildSections(language: BookLanguage) {
  const bookConfig = bookConfigs[language];
  const languagePrefix = `/${language}`;
  const markdownModules = Object.entries(markdownContent).filter(([path]) =>
    new RegExp(`^/content/${language}/books/deconstructing_LLM/chapter_\\d+/[^/]+\\.md$`).test(path)
  );

  return markdownModules
    .flatMap(([path, source]) => {
      const match = path.match(/\/(chapter_(\d+))\/([^/]+)\.md$/);
      if (!match) return [];

      const [, chapterId, chapterNumber, sectionId] = match;
      const chapterHref = `${languagePrefix}/books/deconstructing_LLM/chapter-${chapterNumber}`;
      const routeSegment = sectionId === "overview" ? "" : `/${sectionId.replaceAll("_", "-")}`;
      const fallbackTitle = sectionId === "overview"
        ? chapterFallbackTitle(chapterId, language)
        : sectionId.replaceAll("_", ".");
      const fallbackDescription = language === "zh"
        ? `《${bookConfig.title}》${fallbackTitle}`
        : `${bookConfig.title}: ${fallbackTitle}`;
      const chapterOverviewPath = `/content/${language}/books/deconstructing_LLM/${chapterId}/overview.md`;
      const chapterDates = markdownMetadata[chapterOverviewPath] ?? {};
      const sectionDates = markdownMetadata[path] ?? {};
      const published = sectionDates.published || chapterDates.published;
      const updated = sectionDates.updated || chapterDates.updated || published;

      return [{
        id: sectionId,
        chapterId,
        title: headingTitle(source, fallbackTitle),
        description: markdownDescription(source, fallbackDescription),
        href: `${chapterHref}${routeSegment}`,
        source,
        dates: { published, updated },
      }];
    })
    .sort((left, right) => {
      const locale = language === "zh" ? "zh-CN" : "en";
      const chapterComparison = left.chapterId.localeCompare(right.chapterId, locale, { numeric: true });
      if (chapterComparison !== 0) return chapterComparison;

      return sectionOrder(left.id).localeCompare(sectionOrder(right.id), locale, { numeric: true });
    });
}

const sectionsByLanguage = Object.fromEntries(
  languages.map((language) => [language, buildSections(language)]),
) as Record<BookLanguage, BookSection[]>;

export function getDeconstructingLlmSections(
  chapterId?: string,
  language: BookLanguage = "zh",
) {
  const sections = sectionsByLanguage[language];
  return chapterId ? sections.filter((section) => section.chapterId === chapterId) : sections;
}

export function getDeconstructingLlmChapterSeo(
  chapterId: string,
  language: BookLanguage = "zh",
): BookChapterSeo | undefined {
  const chapterSeo = bookConfigs[language].chapterSeo as Record<string, BookChapterSeo>;
  return chapterSeo[chapterId];
}

export function getDeconstructingLlmSection(
  chapterId: string,
  routeSection = "overview",
  language: BookLanguage = "zh",
) {
  const sectionId = decodeURIComponent(routeSection).replaceAll("-", "_");
  return sectionsByLanguage[language].find(
    (section) => section.chapterId === chapterId && section.id === sectionId,
  );
}

export function getDeconstructingLlmChapterId(routeChapter: string) {
  const match = decodeURIComponent(routeChapter).match(/^chapter-(\d+)$/);
  return match ? `chapter_${match[1]}` : undefined;
}

export function getDeconstructingLlmRouteChapter(chapterId: string) {
  return chapterId.replace("chapter_", "chapter-");
}

export function getDeconstructingLlmNavigation(
  language: BookLanguage = "zh",
): BookNavigation {
  const bookConfig = bookConfigs[language];

  return {
    title: bookConfig.title,
    subtitle: bookConfig.subtitle,
    chapters: bookChapterIdsByLanguage[language].map((chapterId) => {
      const chapterSections = getDeconstructingLlmSections(chapterId, language);
      const chapterOverview = chapterSections.find((section) => section.id === "overview");

      return {
        id: chapterId,
        title: chapterOverview
          ? headingTitle(chapterOverview.source, chapterFallbackTitle(chapterId, language))
          : chapterFallbackTitle(chapterId, language),
        href: chapterOverview?.href,
        sections: chapterSections
          .filter((section) => section.id !== "overview")
          .map(({ id, title, href }) => ({ id, title, href })),
      };
    }),
  };
}

export function getDeconstructingLlmLatestSection(language: BookLanguage = "zh") {
  return sectionsByLanguage[language].at(-1);
}

export function getDeconstructingLlmNeighbors(
  currentHref: string,
  language: BookLanguage = "zh",
) {
  const sections = sectionsByLanguage[language];
  const currentIndex = sections.findIndex((section) => section.href === currentHref);

  return {
    previousPage: currentIndex > 0 ? sections[currentIndex - 1] : undefined,
    nextPage: currentIndex >= 0 ? sections[currentIndex + 1] : undefined,
  };
}
