import { getDeconstructingLlmImages } from "@/app/lib/bookImages";
import {
  getDeconstructingLlmSection,
  getDeconstructingLlmNavigation,
  getDeconstructingLlmNeighbors,
  type BookLanguage,
  type BookSection,
} from "@/app/lib/deconstructingLlmContent";
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

  return (
    <ReadingPage
      lang={language}
      kind="book"
      source={section.source}
      images={getDeconstructingLlmImages(section.chapterId, language)}
      bookNavigation={getDeconstructingLlmNavigation(language)}
      currentHref={section.href}
      languageHref={alternateSection?.href}
      previousPage={neighbors.previousPage}
      nextPage={neighbors.nextPage}
      contentOnly
    />
  );
}
