import {
  bookChapterIds,
  bookChapterIdsByLanguage,
  bookImages,
  bookImagesByLanguage,
  markdownContent,
} from "@/.generated/content";

export {
  bookChapterIds,
  bookChapterIdsByLanguage,
  bookImages,
  bookImagesByLanguage,
  markdownContent,
};

export function getMarkdownContent(path: keyof typeof markdownContent) {
  return markdownContent[path];
}
