import {
  bookChapterIds,
  bookImages,
  markdownContent,
} from "@/.generated/content";

export { bookChapterIds, bookImages, markdownContent };

export function getMarkdownContent(path: keyof typeof markdownContent) {
  return markdownContent[path];
}
