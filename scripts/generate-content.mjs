import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { watch } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseContentDocument } from "./lib/content-metadata.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(projectRoot, "content");
const bookRoots = {
  zh: join(contentRoot, "zh", "books", "deconstructing_LLM"),
  en: join(contentRoot, "en", "books", "deconstructing_LLM"),
};
const blogRoots = {
  zh: join(contentRoot, "zh", "blog"),
  en: join(contentRoot, "en", "blog"),
};
const generatedRoot = join(projectRoot, ".generated");
const generatedModule = join(generatedRoot, "content.ts");
const generatedBookAssets = join(projectRoot, "public", "generated", "book-images");
const generatedBlogAssets = join(projectRoot, "public", "generated", "blog-images");
const generatedSearchIndex = join(projectRoot, "public", "generated", "search-index.json");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"]);

function posixPath(path) {
  return path.split(sep).join("/");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name, "zh-CN", { numeric: true })
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile()) files.push(path);
  }

  return files;
}

async function chapterIds(bookRoot) {
  const entries = await readdir(bookRoot, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory() && /^chapter_\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true }));

  const published = await Promise.all(candidates.map(async (chapterId) => {
    const chapterEntries = await readdir(join(bookRoot, chapterId), { withFileTypes: true });
    return chapterEntries.some((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
      ? chapterId
      : undefined;
  }));

  return published.filter(Boolean);
}

async function collectMarkdown() {
  const files = (await walk(contentRoot)).filter((path) => extname(path).toLowerCase() === ".md");
  const entries = await Promise.all(files.map(async (path) => {
    const key = `/content/${posixPath(relative(contentRoot, path))}`;
    const document = parseContentDocument(await readFile(path, "utf8"), key);
    return [key, document];
  }));

  return {
    markdown: Object.fromEntries(entries.map(([key, document]) => [key, document.content])),
    metadata: Object.fromEntries(entries.map(([key, document]) => [key, document.metadata])),
  };
}

function markdownTitle(source, fallback) {
  const heading = source.match(/^#{1,6}\s+(.+?)\s*$/m)?.[1];

  return heading
    ?.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim() || fallback;
}

function markdownPlainText(source) {
  return source
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/```[^\n]*\n([^]*?)```/g, "$1")
    .replace(/!\[([^\]]*)]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchEntryForMarkdown(key, source) {
  const match = key.match(/^\/content\/(zh|en)\/(.+)\.md$/);
  if (!match) return;

  const [, language, relativePath] = match;
  const bookMatch = relativePath.match(/^books\/deconstructing_LLM\/(?:chapter_(\d+)\/)?(overview|\d+_\d+)$/);
  const blogMatch = relativePath.match(/^blog\/(.+)$/);
  let url;
  let kind;
  let fallback;

  if (relativePath === "about") {
    url = `/${language}/about`;
    kind = language === "zh" ? "关于" : "About";
    fallback = kind;
  } else if (bookMatch) {
    const [, chapterNumber, fileName] = bookMatch;
    if (!chapterNumber) {
      url = `/${language}/books/deconstructing_LLM`;
    } else if (fileName === "overview") {
      url = `/${language}/books/deconstructing_LLM/chapter-${chapterNumber}`;
    } else {
      url = `/${language}/books/deconstructing_LLM/chapter-${chapterNumber}/${fileName.replaceAll("_", "-")}`;
    }
    kind = language === "zh" ? "书籍" : "Book";
    fallback = language === "zh" ? "解构大语言模型" : "Deconstructing Large Language Models";
  } else if (blogMatch) {
    const parts = blogMatch[1].split("/");
    const blogPath = parts.length > 1 && parts.at(-1) === parts.at(-2)
      ? parts.slice(0, -1).join("/")
      : blogMatch[1];
    url = `/${language}/blog/${blogPath}`;
    kind = language === "zh" ? "博客" : "Blog";
    fallback = blogPath.replaceAll("-", " ");
  } else {
    return;
  }

  return {
    lang: language,
    url,
    kind,
    title: markdownTitle(source, fallback),
    text: markdownPlainText(source),
  };
}

async function writeSearchIndex(markdown) {
  const siteConfigs = Object.fromEntries(await Promise.all(["zh", "en"].map(async (language) => [
    language,
    JSON.parse(await readFile(join(contentRoot, language, "site.json"), "utf8")),
  ])));
  const entries = Object.entries(markdown)
    .map(([key, source]) => searchEntryForMarkdown(key, source))
    .filter((entry) => entry && (entry.kind !== "博客" && entry.kind !== "Blog" || siteConfigs[entry.lang]?.essay?.available));

  await mkdir(dirname(generatedSearchIndex), { recursive: true });
  await writeFile(generatedSearchIndex, `${JSON.stringify(entries)}\n`, "utf8");
  return entries.length;
}

async function collectBookImages(bookRoot, ids, language) {
  const images = {};

  for (const chapterId of ids) {
    const sourceDirectory = join(bookRoot, chapterId, "images");
    const publicDirectory = language === "zh" ? chapterId : join(language, chapterId);
    const destinationDirectory = join(generatedBookAssets, publicDirectory);
    let entries = [];

    try {
      entries = await readdir(sourceDirectory, { withFileTypes: true });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }

    images[chapterId] = {};
    for (const entry of entries
      .filter((candidate) => candidate.isFile() && imageExtensions.has(extname(candidate.name).toLowerCase()))
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN", { numeric: true }))) {
      await mkdir(destinationDirectory, { recursive: true });
      await copyFile(join(sourceDirectory, entry.name), join(destinationDirectory, entry.name));
      images[chapterId][`./images/${entry.name}`] = `/generated/book-images/${posixPath(publicDirectory)}/${entry.name}`;
    }
  }

  return images;
}

async function collectBlogImages(blogRoot, language) {
  const directories = (await readdir(blogRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name, "zh-CN", { numeric: true }));
  const images = {};

  for (const directory of directories) {
    const sourceDirectory = join(blogRoot, directory.name);
    images[directory.name] = {};

    for (const path of (await walk(sourceDirectory)).filter(
      (file) => imageExtensions.has(extname(file).toLowerCase()),
    )) {
      const localPath = posixPath(relative(sourceDirectory, path));
      const publicPath = posixPath(join(language, directory.name, localPath));
      const destination = join(generatedBlogAssets, language, directory.name, localPath);
      await mkdir(dirname(destination), { recursive: true });
      await copyFile(path, destination);
      images[directory.name][`./${localPath}`] = `/generated/blog-images/${publicPath}`;
    }
  }

  return images;
}

export async function generateContent() {
  const chapterIdEntries = await Promise.all(
    Object.entries(bookRoots).map(async ([language, bookRoot]) => [language, await chapterIds(bookRoot)]),
  );
  const idsByLanguage = Object.fromEntries(chapterIdEntries);
  await Promise.all([
    rm(generatedBookAssets, { recursive: true, force: true }),
    rm(generatedBlogAssets, { recursive: true, force: true }),
  ]);
  const [documents, imageEntries, blogImageEntries] = await Promise.all([
    collectMarkdown(),
    Promise.all(Object.entries(bookRoots).map(async ([language, bookRoot]) => [
      language,
      await collectBookImages(bookRoot, idsByLanguage[language], language),
    ])),
    Promise.all(Object.entries(blogRoots).map(async ([language, blogRoot]) => [
      language,
      await collectBlogImages(blogRoot, language),
    ])),
  ]);
  const { markdown, metadata } = documents;
  const imagesByLanguage = Object.fromEntries(imageEntries);
  const blogImagesByLanguage = Object.fromEntries(blogImageEntries);
  const source = [
    "// Generated by scripts/generate-content.mjs. Do not edit by hand.",
    `export const markdownContent: Record<string, string> = ${JSON.stringify(markdown, null, 2)};`,
    `export const markdownMetadata: Record<string, { published?: string; updated?: string }> = ${JSON.stringify(metadata, null, 2)};`,
    `export const bookChapterIds: string[] = ${JSON.stringify(idsByLanguage.zh, null, 2)};`,
    `export const bookChapterIdsByLanguage: Record<"zh" | "en", string[]> = ${JSON.stringify(idsByLanguage, null, 2)};`,
    `export const bookImages: Record<string, Record<string, string>> = ${JSON.stringify(imagesByLanguage.zh, null, 2)};`,
    `export const bookImagesByLanguage: Record<"zh" | "en", Record<string, Record<string, string>>> = ${JSON.stringify(imagesByLanguage, null, 2)};`,
    `export const blogImagesByLanguage: Record<"zh" | "en", Record<string, Record<string, string>>> = ${JSON.stringify(blogImagesByLanguage, null, 2)};`,
    "",
  ].join("\n\n");

  await mkdir(generatedRoot, { recursive: true });
  const searchEntryCount = await writeSearchIndex(markdown);
  const temporaryModule = `${generatedModule}.tmp`;
  await writeFile(temporaryModule, source, "utf8");
  await rename(temporaryModule, generatedModule);
  console.log(
    `内容索引已更新：${Object.keys(markdown).length} 篇 Markdown，中文 ${idsByLanguage.zh.length} 章，英文 ${idsByLanguage.en.length} 章，搜索收录 ${searchEntryCount} 页。`,
  );
}

export async function watchContent() {
  await generateContent();
  let timer;
  const watcher = watch(contentRoot, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      generateContent().catch((error) => console.error("内容索引更新失败：", error));
    }, 120);
  });

  return () => {
    clearTimeout(timer);
    watcher.close();
  };
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (invokedDirectly) {
  if (process.argv.includes("--watch")) {
    await watchContent();
    console.log("正在监视 content/ 中的 Markdown 和图片……");
  } else {
    await generateContent();
  }
}
