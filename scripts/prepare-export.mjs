import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { effectiveContentDates, parseContentDocument } from "./lib/content-metadata.mjs";
import { generateConfiguredMediumImport } from "./medium-import.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = join(projectRoot, "out");
const bookRoots = {
  zh: join(projectRoot, "content", "zh", "books", "deconstructing_LLM"),
  en: join(projectRoot, "content", "en", "books", "deconstructing_LLM"),
};
const defaultSiteUrl = "https://gentang.github.io/";
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl;
const siteRoot = new URL(configuredSiteUrl.endsWith("/") ? configuredSiteUrl : `${configuredSiteUrl}/`);
const siteDescription = "《解构大语言模型》在线书稿，以及关于人工智能、数学与智能系统的长期笔记。";

function absoluteUrl(route) {
  if (route === "/") return siteRoot.toString();
  const withoutLeadingSlash = route.replace(/^\/+/, "");
  const looksLikeFile = /\/[^/]+\.[a-z0-9]+$/i.test(`/${withoutLeadingSlash}`);
  const relative = withoutLeadingSlash.endsWith("/") || looksLikeFile
    ? withoutLeadingSlash
    : `${withoutLeadingSlash}/`;

  return new URL(relative, siteRoot).toString();
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function headingTitle(source, fallback) {
  const heading = source.match(/^#{1,6}\s+(.+?)\s*$/m)?.[1];

  return heading
    ?.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim() || fallback;
}

function sectionSortKey(name) {
  return name === "overview.md" ? "0" : name;
}

async function bookEntries(language = "zh") {
  const bookRoot = bookRoots[language];
  const languagePrefix = `/${language}`;
  const directoryEntries = await readdir(bookRoot, { withFileTypes: true });
  const chapterDirectories = directoryEntries
    .filter((entry) => entry.isDirectory() && /^chapter_\d+$/.test(entry.name))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "zh-CN", { numeric: true }));
  const entries = [];

  for (const chapterDirectory of chapterDirectories) {
    const chapterNumber = chapterDirectory.match(/\d+$/)?.[0];
    const files = (await readdir(join(bookRoot, chapterDirectory), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
      .map((entry) => entry.name)
      .sort((left, right) => sectionSortKey(left).localeCompare(sectionSortKey(right), "zh-CN", { numeric: true }));

    for (const file of files) {
      const path = join(bookRoot, chapterDirectory, file);
      const document = parseContentDocument(await readFile(path, "utf8"), path);
      const chapterOverviewPath = join(bookRoot, chapterDirectory, "overview.md");
      const chapterDocument = file === "overview.md"
        ? document
        : parseContentDocument(await readFile(chapterOverviewPath, "utf8"), chapterOverviewPath);
      const dates = effectiveContentDates(document.metadata, chapterDocument.metadata);
      const source = document.content;
      const sectionId = file.replace(/\.md$/i, "");
      const route = sectionId === "overview"
        ? `${languagePrefix}/books/deconstructing_LLM/chapter-${chapterNumber}`
        : `${languagePrefix}/books/deconstructing_LLM/chapter-${chapterNumber}/${sectionId.replaceAll("_", "-")}`;
      const fallback = sectionId === "overview"
        ? (language === "zh" ? `第 ${chapterNumber} 章` : `Chapter ${chapterNumber}`)
        : sectionId.replaceAll("_", ".");
      const title = headingTitle(source, fallback);

      entries.push({
        route,
        title,
        summary: language === "zh"
          ? `《解构大语言模型：从线性回归到通用智能》${title}`
          : `Deconstructing Large Language Models: ${title}`,
        published: dates.published,
        updated: dates.updated,
      });
    }
  }

  return entries;
}

async function overviewEntries() {
  return Promise.all(Object.entries(bookRoots).map(async ([language, bookRoot]) => {
    const config = JSON.parse(await readFile(join(bookRoot, "book.json"), "utf8"));
    return {
      route: `/${language}/books/deconstructing_LLM`,
      title: `${config.title}: ${config.subtitle}`,
      summary: config.overview.seoDescription,
      published: config.dates.published,
      updated: config.dates.updated,
    };
  }));
}

async function blogEntries() {
  const entriesByLanguage = await Promise.all(["zh", "en"].map(async (language) => {
    const siteConfig = JSON.parse(await readFile(join(projectRoot, "content", language, "site.json"), "utf8"));
    const section = siteConfig.essay;
    const posts = section?.posts?.filter((post) => post.available) ?? [];

    return Promise.all(posts.map(async (post) => {
      const relativePath = post.href.replace(new RegExp(`^/${language}/blog/`), "");
      const candidates = [
        join(projectRoot, "content", language, "blog", `${relativePath}.md`),
        join(projectRoot, "content", language, "blog", relativePath, `${relativePath}.md`),
      ];
      let path;
      let source;
      for (const candidate of candidates) {
        try {
          source = await readFile(candidate, "utf8");
          path = candidate;
          break;
        } catch (error) {
          if (error?.code !== "ENOENT") throw error;
        }
      }
      if (!path || !source) throw new Error(`找不到博客正文：${relativePath}`);

      const document = parseContentDocument(source, path);
      const dates = effectiveContentDates(document.metadata);
      return {
        route: post.href,
        title: post.title,
        summary: document.metadata.summary || section.sectionDescription || post.title,
        ...dates,
      };
    }));
  }));

  return entriesByLanguage.flat();
}

async function writeCrawlerFiles(entries, overviews) {
  const routes = [
    { route: "/zh/", updated: overviews.find((entry) => entry.route.startsWith("/zh/"))?.updated },
    { route: "/en/", updated: overviews.find((entry) => entry.route.startsWith("/en/"))?.updated },
    { route: "/zh/about" },
    { route: "/en/about" },
    ...overviews,
    ...entries,
  ];
  const uniqueRoutes = [...new Map(routes.map((entry) => [entry.route, entry])).values()];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueRoutes.map(({ route, updated }) => [
      "  <url>",
      `    <loc>${xmlEscape(absoluteUrl(route))}</loc>`,
      ...(updated ? [`    <lastmod>${xmlEscape(updated)}</lastmod>`] : []),
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");
  const robots = [
    "# Ordinary search engines and answer-oriented crawlers may index the site.",
    "User-agent: *",
    "Allow: /",
    "",
    "User-agent: OAI-SearchBot",
    "Allow: /",
    "",
    "# Opt out of model-training crawlers without blocking ordinary search.",
    "User-agent: GPTBot",
    "Disallow: /",
    "",
    "User-agent: Google-Extended",
    "Disallow: /",
    "",
    "User-agent: ClaudeBot",
    "Disallow: /",
    "",
    "User-agent: CCBot",
    "Disallow: /",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");

  await Promise.all([
    writeFile(join(outputRoot, "robots.txt"), robots, "utf8"),
    writeFile(join(outputRoot, "sitemap.xml"), sitemap, "utf8"),
  ]);
}

async function writeFeeds(entries) {
  const feedEntries = [...entries].reverse();
  const now = new Date();
  const rssItems = feedEntries.map((entry) => [
    "    <item>",
    `      <title>${xmlEscape(entry.title)}</title>`,
    `      <link>${xmlEscape(absoluteUrl(entry.route))}</link>`,
    `      <guid isPermaLink="true">${xmlEscape(absoluteUrl(entry.route))}</guid>`,
    `      <description>${xmlEscape(entry.summary)}</description>`,
    ...(entry.published ? [`      <pubDate>${new Date(`${entry.published}T00:00:00Z`).toUTCString()}</pubDate>`] : []),
    "    </item>",
  ].join("\n"));
  const rss = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>小胖笔记</title>",
    `    <link>${xmlEscape(absoluteUrl("/zh/"))}</link>`,
    `    <description>${xmlEscape(siteDescription)}</description>`,
    "    <language>zh-CN</language>",
    `    <lastBuildDate>${now.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${xmlEscape(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />`,
    ...rssItems,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
  const atomEntries = feedEntries.map((entry) => [
    "  <entry>",
    `    <title>${xmlEscape(entry.title)}</title>`,
    `    <id>${xmlEscape(absoluteUrl(entry.route))}</id>`,
    `    <link href="${xmlEscape(absoluteUrl(entry.route))}" />`,
    `    <updated>${entry.updated ? `${entry.updated}T00:00:00.000Z` : now.toISOString()}</updated>`,
    ...(entry.published ? [`    <published>${entry.published}T00:00:00.000Z</published>`] : []),
    `    <summary>${xmlEscape(entry.summary)}</summary>`,
    "  </entry>",
  ].join("\n"));
  const atom = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="zh-CN">',
    "  <title>小胖笔记</title>",
    `  <id>${xmlEscape(absoluteUrl("/zh/"))}</id>`,
    `  <link href="${xmlEscape(absoluteUrl("/atom.xml"))}" rel="self" />`,
    `  <link href="${xmlEscape(absoluteUrl("/zh/"))}" />`,
    `  <updated>${now.toISOString()}</updated>`,
    "  <author><name>唐亘</name></author>",
    ...atomEntries,
    "</feed>",
    "",
  ].join("\n");

  await Promise.all([
    writeFile(join(outputRoot, "rss.xml"), rss, "utf8"),
    writeFile(join(outputRoot, "atom.xml"), atom, "utf8"),
  ]);
}

async function htmlFiles(directory) {
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".html") files.push(path);
  }
  return files;
}

async function markEnglishPages() {
  const files = await htmlFiles(join(outputRoot, "en"));
  await Promise.all(files.map(async (file) => {
    const source = await readFile(file, "utf8");
    const updated = source.replace(/<html lang="zh-CN"/, '<html lang="en"');
    if (updated !== source) await writeFile(file, updated, "utf8");
  }));
}

export async function prepareExport() {
  const overviews = await overviewEntries();
  const feedEntries = [
    overviews.find((entry) => entry.route.startsWith("/zh/")),
    ...await bookEntries("zh"),
    ...await blogEntries(),
  ].filter(Boolean);
  const crawlerEntries = [
    ...feedEntries,
    ...await bookEntries("en"),
  ];
  const [, , , , mediumImports] = await Promise.all([
    writeFile(join(outputRoot, ".nojekyll"), "", "utf8"),
    writeCrawlerFiles(crawlerEntries, overviews),
    writeFeeds(feedEntries),
    markEnglishPages(),
    generateConfiguredMediumImport(),
  ]);
  const mediumMessage = mediumImports?.length ? `，${mediumImports.length} 篇 Medium 临时导入页` : "";
  console.log(`静态站点已生成到 out/，包含 ${feedEntries.length} 个订阅条目${mediumMessage}。\n`);
  if (mediumImports?.length) {
    console.log("本次构建的 Medium 临时导入地址：");
    for (const page of mediumImports) console.log(page.importUrl);
    console.log("");
  }
}

const invokedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (invokedDirectly) await prepareExport();
