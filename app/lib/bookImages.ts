import type { BookLanguage } from "./deconstructingLlmContent";
import { bookImagesByLanguage } from "./content";
import { sitePath } from "./sitePath";

export function getDeconstructingLlmImages(
  chapterId: string,
  language: BookLanguage = "zh",
) {
  return Object.fromEntries(
    Object.entries(bookImagesByLanguage[language][chapterId] ?? {}).map(([markdownPath, publicPath]) => [
      markdownPath,
      sitePath(publicPath),
    ]),
  );
}
