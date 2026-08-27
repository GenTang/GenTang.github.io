import { getDeconstructingLlmImages } from "@/app/lib/bookImages";
import {
  getDeconstructingLlmSection,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmNeighbors,
  type BookLanguage,
  type BookSection,
} from "@/app/lib/deconstructingLlmContent";
import { absoluteSiteUrl } from "@/app/lib/siteMetadata";
import { JsonLd } from "./JsonLd";
import { ReadingPage } from "./ReadingPage";

type DeconstructingLlmPageProps = {
  section: BookSection;
  language?: BookLanguage;
};

export function DeconstructingLlmPage({
  section,
  language = "zh",
}: DeconstructingLlmPageProps) {
  const neighbors = getDeconstructingLlmNeighbors(section.href, language);
  const alternateLanguage = language === "zh" ? "en" : "zh";
  const alternateSection = getDeconstructingLlmSection(
    section.chapterId,
    section.id,
    alternateLanguage,
  );
  const navigation = getDeconstructingLlmNavigation(language);
  const chapter = navigation.chapters.find((candidate) => candidate.id === section.chapterId);
  const homeHref = language === "zh" ? "/zh/" : "/en/";
  const bookHref = `/${language}/books/deconstructing_LLM`;
  const authorHref = language === "zh" ? "/zh/about" : "/en/about";
  const authorName = language === "zh" ? "唐亘" : "Gen Tang";
  const breadcrumbItems = [
    { name: language === "zh" ? "首页" : "Home", href: homeHref },
    { name: navigation.title, href: bookHref },
    ...(chapter?.href ? [{ name: chapter.title, href: chapter.href }] : []),
    ...(section.id !== "overview" ? [{ name: section.title, href: section.href }] : []),
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${absoluteSiteUrl(section.href)}#article`,
        headline: section.title,
        description: section.description,
        url: absoluteSiteUrl(section.href),
        mainEntityOfPage: absoluteSiteUrl(section.href),
        inLanguage: language === "zh" ? "zh-CN" : "en",
        datePublished: section.dates.published,
        dateModified: section.dates.updated,
        isAccessibleForFree: true,
        author: {
          "@type": "Person",
          "@id": `${absoluteSiteUrl(authorHref)}#person`,
          name: authorName,
          url: absoluteSiteUrl(authorHref),
        },
        isPartOf: {
          "@type": "Book",
          "@id": `${absoluteSiteUrl(bookHref)}#book`,
          name: navigation.title,
          url: absoluteSiteUrl(bookHref),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteSiteUrl(item.href),
        })),
      },
    ],
  };

  return (
    <>
      <JsonLd data={structuredData} />
      <ReadingPage
        lang={language}
        kind="book"
        source={section.source}
        images={getDeconstructingLlmImages(section.chapterId, language)}
        bookNavigation={navigation}
        currentHref={section.href}
        languageHref={alternateSection?.href}
        previousPage={neighbors.previousPage}
        nextPage={neighbors.nextPage}
        dates={section.dates}
        promoteFirstHeading={section.id !== "overview"}
        contentOnly
      />
    </>
  );
}
