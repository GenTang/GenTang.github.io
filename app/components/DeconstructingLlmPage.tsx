import { getDeconstructingLlmImages } from "@/app/lib/bookImages";
import {
  getDeconstructingLlmNavigation,
  getDeconstructingLlmNeighbors,
  type BookSection,
} from "@/app/lib/deconstructingLlmContent";
import { ReadingPage } from "./ReadingPage";

type DeconstructingLlmPageProps = {
  section: BookSection;
};

export function DeconstructingLlmPage({ section }: DeconstructingLlmPageProps) {
  const neighbors = getDeconstructingLlmNeighbors(section.href);

  return (
    <ReadingPage
      lang="zh"
      kind="book"
      source={section.source}
      images={getDeconstructingLlmImages(section.chapterId)}
      bookNavigation={getDeconstructingLlmNavigation()}
      currentHref={section.href}
      previousPage={neighbors.previousPage}
      nextPage={neighbors.nextPage}
      contentOnly
    />
  );
}
