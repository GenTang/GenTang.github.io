import {
  blogPostsByLanguage,
  bookChapterIds,
  bookChapterIdsByLanguage,
  bookImages,
  bookImagesByLanguage,
  blogImagesByLanguage,
  markdownContent,
  markdownMetadata,
} from "@/.generated/content";

export {
  blogPostsByLanguage,
  bookChapterIds,
  bookChapterIdsByLanguage,
  bookImages,
  bookImagesByLanguage,
  blogImagesByLanguage,
  markdownContent,
  markdownMetadata,
};

export type BlogLanguage = "zh" | "en";

export function getBlogPosts(lang: BlogLanguage) {
  return blogPostsByLanguage[lang];
}

export function getBlogPost(lang: BlogLanguage, slug: string) {
  return getBlogPosts(lang).find((post) => post.slug === slug);
}

export function getMarkdownContent(path: keyof typeof markdownContent) {
  return markdownContent[path];
}

export function getMarkdownMetadata(path: keyof typeof markdownContent) {
  return markdownMetadata[path] ?? {};
}

export function getBlogMarkdownPath(lang: "zh" | "en", href: string) {
  const slug = href.split("/").filter(Boolean).at(-1) ?? "";
  const nested = `/content/${lang}/blog/${slug}/${slug}.md`;
  return nested in markdownContent ? nested : `/content/${lang}/blog/${slug}.md`;
}

export function getBlogMarkdownMetadata(lang: "zh" | "en", href: string) {
  return getMarkdownMetadata(getBlogMarkdownPath(lang, href));
}

export function getBlogMarkdownTitle(lang: "zh" | "en", href: string) {
  return getMarkdownTitle(getMarkdownContent(getBlogMarkdownPath(lang, href)));
}

export function getBlogImages(lang: "zh" | "en", slug: string) {
  return blogImagesByLanguage[lang]?.[slug] ?? {};
}

export function withoutLeadingMarkdownTitle(source: string) {
  return source.replace(/^\s*#\s+[^\n]+\r?\n+/, "");
}

function markdownHeadingText(source: string) {
  return source
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .trim();
}

function markdownHeadingSlug(source: string) {
  return markdownHeadingText(source)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "-");
}

export function getMarkdownTitle(source: string) {
  const heading = source.match(/^#\s+(.+?)\s*$/m)?.[1] ?? "";
  return markdownHeadingText(heading);
}

export function getMarkdownDescription(source: string) {
  const paragraph = source.split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(?:#|```|[-*>]\s)/.test(block)) ?? "";
  return markdownHeadingText(paragraph.replace(/\s*\r?\n\s*/g, " "));
}

export function getMarkdownOutline(source: string) {
  const slugs = new Map<string, number>();
  return [...source.matchAll(/^(#{2,3})\s+(.+?)\s*$/gm)].map((match) => {
    const label = markdownHeadingText(match[2]);
    const base = markdownHeadingSlug(match[2]);
    const duplicate = slugs.get(base) ?? 0;
    slugs.set(base, duplicate + 1);
    return {
      href: `#${duplicate ? `${base}-${duplicate}` : base}`,
      label,
      level: match[1].length as 2 | 3,
    };
  });
}
