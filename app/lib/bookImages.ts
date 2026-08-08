import { bookImages } from "./content";
import { sitePath } from "./sitePath";

export function getDeconstructingLlmImages(chapterId: string) {
  return Object.fromEntries(
    Object.entries(bookImages[chapterId] ?? {}).map(([markdownPath, publicPath]) => [
      markdownPath,
      sitePath(publicPath),
    ]),
  );
}
