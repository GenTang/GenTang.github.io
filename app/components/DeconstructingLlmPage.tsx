import { getDeconstructingLlmImages } from "@/app/lib/bookImages";
import {
  getDeconstructingLlmSection,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmNeighbors,
  type BookLanguage,
  type BookSection,
} from "@/app/lib/deconstructingLlmContent";
import { absoluteSiteUrl } from "@/app/lib/siteMetadata";
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: section.title,
    description: section.description,
    url: absoluteSiteUrl(section.href),
    inLanguage: language === "zh" ? "zh-CN" : "en",
    datePublished: section.dates.published,
    dateModified: section.dates.updated,
    author: {
      "@type": "Person",
      name: language === "zh" ? "唐亘" : "Gen Tang",
    },
    isPartOf: {
      "@type": "Book",
      name: navigation.title,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
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
        contentOnly
      />
    </>
  );
}
