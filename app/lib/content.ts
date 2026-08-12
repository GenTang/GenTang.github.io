import {
  bookChapterIds,
  bookChapterIdsByLanguage,
  bookImages,
  bookImagesByLanguage,
  markdownContent,
  markdownMetadata,
} from "@/.generated/content";

export {
  bookChapterIds,
  bookChapterIdsByLanguage,
  bookImages,
  bookImagesByLanguage,
  markdownContent,
  markdownMetadata,
};

export function getMarkdownContent(path: keyof typeof markdownContent) {
  return markdownContent[path];
}

export function getMarkdownMetadata(path: keyof typeof markdownContent) {
  return markdownMetadata[path] ?? {};
}
