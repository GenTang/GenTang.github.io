import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

const outputRoot = resolve("out");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const siteRoot = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gentang.github.io/");

function publicUrl(route) {
  if (route === "/") return siteRoot.toString();
  const relative = route.replace(/^\//, "");
  return new URL(/\/[^/]+\.[a-z0-9]+$/i.test(route) ? relative : `${relative.replace(/\/$/, "")}/`, siteRoot).toString();
}

function exportedPage(route) {
  if (route === "/") return join(outputRoot, "index.html");
  return join(outputRoot, route.replace(/^\//, ""), "index.html");
}

async function html(route) {
  return readFile(exportedPage(route), "utf8");
}

async function blogTitle(language, slug) {
  const source = await readFile(resolve("content", language, "blog", slug, `${slug}.md`), "utf8");
  const title = source.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
  assert.ok(title, `Missing H1 title in ${language}/blog/${slug}`);
  return title;
}

async function discoveredBlogPosts(language) {
  const blogRoot = resolve("content", language, "blog");
  const entries = await readdir(blogRoot, { withFileTypes: true });
  const candidates = entries.flatMap((entry) => {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      return [{ slug: entry.name.replace(/\.md$/i, ""), path: join(blogRoot, entry.name) }];
    }
    if (entry.isDirectory()) {
      return [{ slug: entry.name, path: join(blogRoot, entry.name, `${entry.name}.md`) }];
    }
    return [];
  });
  const posts = [];

  for (const candidate of candidates) {
    let source;
    try {
      source = await readFile(candidate.path, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    if (/^draft:\s*true\s*$/im.test(source)) continue;
    const title = source.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
    assert.ok(title, `Missing H1 title in ${candidate.path}`);
    posts.push({
      ...candidate,
      title,
      route: `/${language}/blog/${candidate.slug}`,
      published: source.match(/^published:\s*(.+?)\s*$/m)?.[1] ?? "",
    });
  }

  return posts.sort((left, right) => right.published.localeCompare(left.published));
}

async function bookSectionTitle(language, chapter, section) {
  const source = await readFile(
    resolve("content", language, "books", "deconstructing_LLM", `chapter_${chapter}`, `${section}.md`),
    "utf8",
  );
  const title = source.match(/^##\s+(.+?)\s*$/m)?.[1]?.trim();
  assert.ok(title, `Missing H2 title in ${language}/chapter_${chapter}/${section}`);
  return title;
}

function exactPattern(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
}

function expectedBookReferenceHref(label) {
  const chapter = label.match(/^第\s*(\d+)\s*章$/)?.[1];
  if (chapter) return `/books/deconstructing_LLM/chapter-${chapter}`;

  const section = label.match(/^(\d+)\.(\d+)(?:\.(\d+))?\s*节$/);
  if (!section) return undefined;
  const [, chapterNumber, sectionNumber, subsectionNumber] = section;
  const page = `/books/deconstructing_LLM/chapter-${chapterNumber}/${chapterNumber}-${sectionNumber}`;
  return subsectionNumber ? `${page}#section-${chapterNumber}-${sectionNumber}-${subsectionNumber}` : page;
}

function unlinkedBookReferences(source) {
  let insideFence = false;
  let insideDisplayMath = false;
  const prose = source.split("\n").map((line) => {
    if (/^```/.test(line.trim())) {
      insideFence = !insideFence;
      return "";
    }
    if (!insideFence && /^\$\$\s*$/.test(line.trim())) {
      insideDisplayMath = !insideDisplayMath;
      return "";
    }
    if (insideFence || insideDisplayMath || /^#{1,6}\s/.test(line)) return "";
    return line
      .replace(/\[[^\]]+\]\([^)]+\)/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/\$[^$\n]*\$/g, "");
  }).join("\n");

  return [...prose.matchAll(/第\s*\d+\s*章|\d+\.\d+(?:\.\d+)?\s*节/g)].map((match) => match[0]);
}

test("exports the homepage with local assets and the intended section order", async () => {
  const source = await html("/zh/");
  const latestBlogPosts = (await discoveredBlogPosts("zh")).slice(0, 3);
  assert.match(source, /<title>小胖笔记｜LLM技术笔记：模型架构、数据基础和工程实现<\/title>/);
  assert.ok(source.includes("小胖笔记提供《解构大语言模型》完整在线书稿与 AI 技术博客"));
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /"@type":"WebSite"/);
  assert.match(source, /小胖笔记/);
  assert.match(source, /万一我证明了<em>黎曼猜想<\/em>/);
  assert.match(source, /阅读最近博客/);
  assert.match(source, /解构大语言模型/);
  assert.match(source.replaceAll("<!-- -->", ""), /全书已完成 · 13 章/);
  assert.doesNotMatch(source, /class="chapter-line"/);
  for (const post of latestBlogPosts) {
    assert.match(source, exactPattern(post.title));
    assert.match(source, new RegExp(`href="${basePath}${post.route}/"`));
  }
  assert.match(source, /持续更新/);
  assert.doesNotMatch(source, /OPEN TO WORK|寻找 LLM \/ AI Systems Engineer 机会/);
  assert.doesNotMatch(source, /NOTE \/ 001/);
  assert.match(source, new RegExp(`href="${basePath}/zh/books/deconstructing_LLM/"`));
  assert.match(source, new RegExp(`href="${basePath}/zh/blog/"`));
  const chapterLinksStart = source.indexOf('class="home-book-chapters"');
  const chapterLinks = source.slice(chapterLinksStart, source.indexOf("</nav>", chapterLinksStart));
  assert.ok(chapterLinksStart >= 0);
  assert.ok(chapterLinks.includes(`href="${basePath}/zh/books/deconstructing_LLM/chapter-1/"`));
  assert.ok(chapterLinks.includes(`href="${basePath}/zh/books/deconstructing_LLM/chapter-13/"`));
  assert.doesNotMatch(source, /BOOK · COMPLETE/);
  assert.ok(source.indexOf(">BLOG<") < source.indexOf(">BOOK<"));
  assert.doesNotMatch(source, /01 \/ BLOG|02 \/ BOOK|全书按章节持续更新，目前已发布绪论与数学基础两章/);
  assert.match(source, new RegExp(`src="${basePath}/images/deconstructing-llm-cover\\.webp"`));
  assert.doesNotMatch(source, /MVP|AI · BOOKS · NOTES|第一本书，从这里开始/);
});

test("keeps the English homepage structurally aligned with the Chinese homepage", async () => {
  const source = await html("/en/");
  const latestBlogPosts = (await discoveredBlogPosts("en")).slice(0, 3);
  assert.match(source, /<title>Xiaopang Notes \| LLM Architecture, Data, and Engineering<\/title>/);
  assert.match(source, /class="brand-mark brand-mark-en">XN<\/span>/);
  assert.match(source, /<strong>Xiaopang Notes<\/strong><small>AI · MATH · SYSTEMS<\/small>/);
  assert.doesNotMatch(source, /class="brand-mark">胖<\/span>/);
  assert.match(source, /If I ever prove the <em>Riemann Hypothesis<\/em>/);
  assert.match(source, /this page should have more room than the <em>margin<\/em>\./);
  assert.match(source, /Read the latest blog/);
  assert.match(source, /Deconstructing Large Language Models/);
  assert.match(source, /BOOK COMPLETE · 13 CHAPTERS/);
  for (const post of latestBlogPosts) {
    assert.match(source, exactPattern(post.title));
    assert.match(source, new RegExp(`href="${basePath}${post.route}/"`));
  }
  assert.doesNotMatch(source, /OPEN TO WORK|Open to LLM \/ AI Systems Engineer opportunities/);
  assert.doesNotMatch(source, /class="chapter-line"|Notes on AI Systems \(working title\)|UPDATED CONTINUOUSLY/);
  assert.ok(source.indexOf(">BLOG<") < source.indexOf(">BOOK<"));
  assert.match(source, new RegExp(`href="${basePath}/en/books/deconstructing_LLM/"`));
  assert.match(source, new RegExp(`href="${basePath}/en/blog/"`));
  assert.match(source, new RegExp(`src="${basePath}/images/deconstructing-llm-cover-en\\.webp"`));
  const chapterLinksStart = source.indexOf('class="home-book-chapters"');
  const chapterLinks = source.slice(chapterLinksStart, source.indexOf("</nav>", chapterLinksStart));
  assert.ok(chapterLinksStart >= 0);
  assert.ok(chapterLinks.includes(`href="${basePath}/en/books/deconstructing_LLM/chapter-1/"`));
  assert.ok(chapterLinks.includes(`href="${basePath}/en/books/deconstructing_LLM/chapter-13/"`));
  assert.match(source, /type="application\/ld\+json"/);
  assert.match(source, /"@type":"WebSite"/);
});

test("keeps the root URL as a static entry to the Chinese site", async () => {
  const source = await html("/");

  assert.match(source, new RegExp(`<meta http-equiv="refresh" content="0; url=${basePath}/zh/"`));
  assert.match(source, new RegExp(`rel="canonical" href="${publicUrl("/zh/").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.doesNotMatch(source, /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(source, /window\.location\.replace/);
  assert.match(source, /<h1>小胖笔记<\/h1>/);
  assert.match(source, new RegExp(`href="${basePath}/zh/"`));
  await assert.rejects(access(join(outputRoot, "books")));
  await assert.rejects(access(join(outputRoot, "blog")));
});

test("exports aligned bilingual blog landing pages that match the homepage state", async () => {
  const [chinese, english] = await Promise.all([
    html("/zh/blog"),
    html("/en/blog"),
  ]);
  const [chinesePartOne, chinesePartTwo, englishPartOne, englishPartTwo] = await Promise.all([
    blogTitle("zh", "watermarking_on_aigc"),
    blogTitle("zh", "watermarking_on_aigc_2"),
    blogTitle("en", "watermarking_on_aigc"),
    blogTitle("en", "watermarking_on_aigc_2"),
  ]);

  assert.match(chinese, /<h1>博客<\/h1>/);
  assert.match(chinese, /<title>AI 技术博客：LLM、文本水印与模型实现 · 小胖笔记<\/title>/);
  assert.match(chinese, /<meta name="description" content="围绕大语言模型的关键机制与工程实践，记录分词器、文本水印与统计检测等主题/);
  assert.match(chinese, exactPattern(chinesePartTwo));
  assert.match(chinese, exactPattern(chinesePartOne));
  assert.match(chinese, /class="essay-row"/);
  assert.doesNotMatch(chinese, /class="essay-row is-disabled"|name="robots" content="noindex, follow"/);
  assert.match(chinese, new RegExp(`href="${basePath}/en/blog/"`));
  assert.match(chinese, new RegExp(`href="${basePath}/zh/blog/watermarking_on_aigc_2/"`));
  assert.match(chinese, new RegExp(`href="${basePath}/zh/blog/watermarking_on_aigc/"`));

  assert.match(english, /<h1>Blog<\/h1>/);
  assert.match(english, /<title>LLM Engineering: Watermarking, Models, and Code · Xiaopang Notes<\/title>/);
  assert.match(english, /<meta name="description" content="Technical essays on the mechanisms and engineering of large language models/);
  assert.match(english, /class="brand-mark brand-mark-en">XN<\/span>/);
  assert.doesNotMatch(english, /class="brand-mark">胖<\/span>/);
  assert.match(english, exactPattern(englishPartTwo));
  assert.match(english, exactPattern(englishPartOne));
  assert.match(english, /class="essay-row"/);
  assert.doesNotMatch(english, /class="essay-row is-disabled"|name="robots" content="noindex, follow"/);
  assert.match(english, new RegExp(`href="${basePath}/zh/blog/"`));
  assert.match(english, new RegExp(`href="${basePath}/en/blog/watermarking_on_aigc_2/"`));
  assert.match(english, new RegExp(`href="${basePath}/en/blog/watermarking_on_aigc/"`));
});

test("automatically exports every canonical blog Markdown without a manual post registry", async () => {
  const [searchIndex, sitemap, rss, generated] = await Promise.all([
    readFile(join(outputRoot, "generated", "search-index.json"), "utf8"),
    readFile(join(outputRoot, "sitemap.xml"), "utf8"),
    readFile(join(outputRoot, "rss.xml"), "utf8"),
    readFile(resolve(".generated/content.ts"), "utf8"),
  ]);
  const searchEntries = JSON.parse(searchIndex);
  assert.match(generated, /export const blogPostsByLanguage/);

  for (const language of ["zh", "en"]) {
    const posts = await discoveredBlogPosts(language);
    const [home, landing] = await Promise.all([html(`/${language}`), html(`/${language}/blog`)]);

    for (const [index, post] of posts.entries()) {
      const page = await html(post.route);
      assert.match(page, exactPattern(post.title), post.route);
      assert.ok(landing.includes(`href="${basePath}${post.route}/"`), `${post.route} missing from blog index`);
      assert.ok(searchEntries.some((entry) => entry.lang === language && entry.url === post.route));
      assert.ok(sitemap.includes(`<loc>${publicUrl(post.route)}</loc>`));
      assert.ok(rss.includes(`<link>${publicUrl(post.route)}</link>`));
      if (index < 3) assert.ok(home.includes(`href="${basePath}${post.route}/"`));
    }
  }
});

test("exports bilingual About pages and the static search index", async () => {
  const [chineseAbout, englishAbout, chineseSearch, englishSearch, searchIndex, sitemap] = await Promise.all([
    html("/zh/about"),
    html("/en/about"),
    html("/zh/search"),
    html("/en/search"),
    readFile(join(outputRoot, "generated", "search-index.json"), "utf8"),
    readFile(join(outputRoot, "sitemap.xml"), "utf8"),
  ]);
  const entries = JSON.parse(searchIndex);

  assert.match(chineseAbout, /唐亘，数据科学家，专注于人工智能与大数据/);
  assert.doesNotMatch(chineseAbout, /目前正在寻找|工作机会/);
  assert.match(chineseAbout, /复旦大学/);
  assert.match(chineseAbout, /巴黎综合理工学院/);
  assert.match(chineseAbout, /联系与反馈/);
  assert.match(chineseAbout, /GenTang\/GenTang\.github\.io\/issues\/new/);
  assert.match(chineseAbout, /GenTang\/GenTang\.github\.io\/discussions/);
  assert.match(chineseAbout, /gen\.tang86@gmail\.com/);
  assert.match(chineseAbout, new RegExp(`src="${basePath}/images/gen-tang\\.png"`));
  assert.match(englishAbout, /Gen Tang is a data scientist/);
  assert.doesNotMatch(englishAbout, /currently looking for|opportunities/);
  assert.match(englishAbout, /École Polytechnique/);
  assert.match(chineseSearch, /搜索小胖笔记/);
  assert.match(englishSearch, /Search Xiaopang Notes/);
  assert.match(chineseSearch, /name="robots" content="noindex, follow"/);
  assert.ok(entries.some((entry) => entry.lang === "zh" && entry.url === "/zh/about"));
  assert.ok(entries.some((entry) => entry.lang === "en" && entry.url === "/en/about"));
  assert.ok(entries.some((entry) => entry.lang === "zh" && entry.url === "/zh/books/deconstructing_LLM/chapter-11/11-1"));
  assert.ok(entries.some((entry) => entry.lang === "zh" && entry.url === "/zh/blog/watermarking_on_aigc"));
  assert.ok(entries.some((entry) => entry.lang === "zh" && entry.url === "/zh/blog/watermarking_on_aigc_2"));
  assert.ok(entries.some((entry) => entry.lang === "en" && entry.url === "/en/blog/watermarking_on_aigc"));
  assert.ok(entries.some((entry) => entry.lang === "en" && entry.url === "/en/blog/watermarking_on_aigc_2"));
  assert.ok(!entries.some((entry) => entry.url.includes("ai-as-collaborator")));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/zh/about")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/about")}</loc>`));
  assert.match(chineseAbout, /"@type":"ProfilePage"/);
  assert.match(englishAbout, /"@type":"ProfilePage"/);
  assert.ok(!sitemap.includes(`<loc>${publicUrl("/zh/search")}</loc>`));
});

test("exports crawl controls, sitemap, feeds, canonical metadata, and correct page languages", async () => {
  const [robots, sitemap, rss, atom, home, latest, publishedBlog, english, englishBlog] = await Promise.all([
    readFile(join(outputRoot, "robots.txt"), "utf8"),
    readFile(join(outputRoot, "sitemap.xml"), "utf8"),
    readFile(join(outputRoot, "rss.xml"), "utf8"),
    readFile(join(outputRoot, "atom.xml"), "utf8"),
    html("/zh/"),
    html("/zh/books/deconstructing_LLM/chapter-13/13-6"),
    html("/zh/blog/watermarking_on_aigc"),
    html("/en/"),
    html("/en/blog/watermarking_on_aigc"),
  ]);
  const publishedBlogMarkdown = await readFile(
    resolve("content/zh/blog/watermarking_on_aigc/watermarking_on_aigc.md"),
    "utf8",
  );
  const publishedBlogUpdated = publishedBlogMarkdown.match(/^updated:\s*(.+?)\s*$/m)?.[1];

  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(robots, /User-agent: GPTBot\nDisallow: \//);
  assert.match(robots, /User-agent: Google-Extended\nDisallow: \//);
  assert.match(robots, new RegExp(`Sitemap: ${publicUrl("/sitemap.xml").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

  assert.ok(sitemap.includes(`<loc>${publicUrl("/zh/")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/zh/blog")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/blog")}</loc>`));
  assert.ok(!sitemap.includes(`<loc>${publicUrl("/")}</loc>`));
  assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.ok(sitemap.includes(`<xhtml:link rel="alternate" hreflang="en" href="${publicUrl("/en/")}" />`));
  assert.ok(sitemap.includes(`<xhtml:link rel="alternate" hreflang="zh-CN" href="${publicUrl("/zh/")}" />`));
  assert.ok(sitemap.includes(`<xhtml:link rel="alternate" hreflang="x-default" href="${publicUrl("/zh/")}" />`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/zh/books/deconstructing_LLM/chapter-13/13-6")}</loc>`));
  assert.match(sitemap, new RegExp(`<loc>${publicUrl("/zh/books/deconstructing_LLM/chapter-13/13-6").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>\\s*<lastmod>2026-08-10</lastmod>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/books/deconstructing_LLM")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/books/deconstructing_LLM/chapter-1")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/books/deconstructing_LLM/chapter-1/1-4")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/zh/blog/watermarking_on_aigc")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/zh/blog/watermarking_on_aigc_2")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/blog/watermarking_on_aigc_2")}</loc>`));
  assert.match(sitemap, new RegExp(`<loc>${publicUrl("/zh/blog/watermarking_on_aigc").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>\\s*<lastmod>${publishedBlogUpdated}</lastmod>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/en/blog/watermarking_on_aigc")}</loc>`));
  assert.ok(rss.includes(`<link>${publicUrl("/zh/books/deconstructing_LLM/chapter-13/13-6")}</link>`));
  assert.ok(rss.includes(`<link>${publicUrl("/zh/blog/watermarking_on_aigc")}</link>`));
  assert.ok(rss.includes(`<link>${publicUrl("/zh/blog/watermarking_on_aigc_2")}</link>`));
  assert.ok(rss.includes(`<link>${publicUrl("/en/blog/watermarking_on_aigc_2")}</link>`));
  assert.match(rss, /<pubDate>Mon, 10 Aug 2026 00:00:00 GMT<\/pubDate>/);
  assert.ok(rss.includes(`<link>${publicUrl("/zh/")}</link>`));
  assert.match(rss, /13\.6 本章小结/);
  assert.ok(atom.includes(`<id>${publicUrl("/zh/books/deconstructing_LLM/chapter-13/13-6")}</id>`));
  assert.match(atom, /<updated>2026-08-10T00:00:00\.000Z<\/updated>/);
  assert.match(atom, /<published>2026-08-10T00:00:00\.000Z<\/published>/);

  assert.ok(home.includes(`rel="canonical" href="${publicUrl("/zh/")}"`));
  assert.ok(home.includes(`type="application/rss+xml"`));
  assert.ok(latest.includes(`rel="canonical" href="${publicUrl("/zh/books/deconstructing_LLM/chapter-13/13-6")}"`));
  assert.match(latest, /property="og:title" content="13\.6 本章小结"/);
  assert.match(latest, /property="article:published_time" content="2026-08-10"/);
  assert.match(latest, /"@type":"TechArticle"/);
  assert.match(latest, /"datePublished":"2026-08-10"/);
  assert.match(latest, /"dateModified":"2026-08-10"/);
  assert.match(latest, /<time dateTime="2026-08-10">2026年8月10日<\/time>/);
  assert.doesNotMatch(publishedBlog, /name="robots" content="noindex, follow"/);
  assert.ok(publishedBlog.includes(`rel="canonical" href="${publicUrl("/zh/blog/watermarking_on_aigc")}"`));
  assert.match(publishedBlog, new RegExp(`hrefLang="en" href="${publicUrl("/en/blog/watermarking_on_aigc").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(publishedBlog, /property="article:published_time" content="2026-08-17"/);
  assert.match(publishedBlog, /"@type":"BlogPosting"/);
  assert.match(publishedBlog, /"@type":"BreadcrumbList"/);
  assert.doesNotMatch(englishBlog, /name="robots" content="noindex, follow"/);
  assert.ok(englishBlog.includes(`rel="canonical" href="${publicUrl("/en/blog/watermarking_on_aigc")}"`));
  assert.match(englishBlog, new RegExp(`hrefLang="zh-CN" href="${publicUrl("/zh/blog/watermarking_on_aigc").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(english, /<html lang="en"/);
  assert.match(english, new RegExp(`hrefLang="zh-CN" href="${publicUrl("/zh/")}"`));
  assert.match(home, /© 2026 唐亘 · 小胖笔记/);
  assert.match(home, new RegExp(`href="${basePath}/rss\\.xml"`));
});

test("uses explicit content dates and bidirectional language alternates", async () => {
  const [chineseOverview, englishOverview, chineseChapter, englishChapter, chineseSynthId, englishSynthId, generated] = await Promise.all([
    html("/zh/books/deconstructing_LLM"),
    html("/en/books/deconstructing_LLM"),
    html("/zh/books/deconstructing_LLM/chapter-1/1-1"),
    html("/en/books/deconstructing_LLM/chapter-1/1-1"),
    html("/zh/blog/watermarking_on_aigc_2"),
    html("/en/blog/watermarking_on_aigc_2"),
    readFile(resolve(".generated/content.ts"), "utf8"),
  ]);

  assert.match(generated, /export const markdownMetadata/);
  assert.doesNotMatch(chineseChapter, /^---$/m);
  assert.match(chineseOverview, new RegExp(`hrefLang="en" href="${publicUrl("/en/books/deconstructing_LLM").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(englishOverview, new RegExp(`hrefLang="zh-CN" href="${publicUrl("/zh/books/deconstructing_LLM").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(chineseOverview, /全书完成 <time dateTime="2024-03-04">2024-03-04<\/time>/);
  assert.match(englishOverview, /Completed <time dateTime="2024-03-04">2024-03-04<\/time>/);
  assert.match(chineseOverview, /在线发布 <time dateTime="2026-08-08">2026-08-08<\/time>/);
  assert.match(englishOverview, /Published online <time dateTime="2026-08-11">2026-08-11<\/time>/);
  assert.match(chineseChapter, /<time dateTime="2026-08-08">2026年8月8日<\/time>/);
  assert.match(chineseChapter, /<time dateTime="2026-08-11">2026年8月11日<\/time>/);
  assert.match(englishChapter, /<time dateTime="2026-08-11">Aug 11, 2026<\/time>/);
  assert.match(chineseSynthId, new RegExp(`hrefLang="en" href="${publicUrl("/en/blog/watermarking_on_aigc_2").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(englishSynthId, new RegExp(`hrefLang="zh-CN" href="${publicUrl("/zh/blog/watermarking_on_aigc_2").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(englishSynthId, /property="article:published_time" content="2026-08-20"/);
});

test("gives every indexable route complete page-level SEO semantics", async () => {
  const sitemap = await readFile(join(outputRoot, "sitemap.xml"), "utf8");
  const routes = [...sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1]).pathname);

  for (const route of routes) {
    const source = await html(route);
    const title = source.match(/<title>([^<]+)<\/title>/)?.[1] ?? "";
    const description = source.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
    const h1Count = source.match(/<h1\b/g)?.length ?? 0;
    const language = route.startsWith("/en/") ? "en" : "zh-CN";

    assert.ok(title.length > 0, `${route}: missing title`);
    assert.ok(title.length <= 75, `${route}: title is too long (${title.length})`);
    assert.ok(description.length >= 30, `${route}: description is too short`);
    assert.ok(description.length <= 170, `${route}: description is too long (${description.length})`);
    assert.doesNotMatch(description, /[*_`$]|\\[a-zA-Z]+/, `${route}: description contains Markdown or LaTeX`);
    assert.equal(h1Count, 1, `${route}: expected exactly one H1`);
    assert.ok(source.includes(`rel="canonical" href="${publicUrl(route)}"`), `${route}: missing canonical`);
    assert.match(source, new RegExp(`<html lang="${language}"`), `${route}: incorrect language`);
    assert.doesNotMatch(source, /name="robots" content="noindex/, `${route}: sitemap route is noindex`);
  }
});

test("exports every current reading route", async () => {
  const [
    chinesePartOne,
    chinesePartTwo,
    englishPartOne,
    englishPartTwo,
    englishChapterOneSectionOne,
    englishChapterOneSectionTwo,
    englishChapterOneSectionThree,
    englishChapterOneSectionFour,
  ] = await Promise.all([
    blogTitle("zh", "watermarking_on_aigc"),
    blogTitle("zh", "watermarking_on_aigc_2"),
    blogTitle("en", "watermarking_on_aigc"),
    blogTitle("en", "watermarking_on_aigc_2"),
    bookSectionTitle("en", 1, "1_1"),
    bookSectionTitle("en", 1, "1_2"),
    bookSectionTitle("en", 1, "1_3"),
    bookSectionTitle("en", 1, "1_4"),
  ]);
  const routes = [
    ["/zh/books/deconstructing_LLM", /READING MAP/],
    ["/en/books/deconstructing_LLM", /Deconstructing Large Language Models/],
    ["/zh/books/deconstructing_LLM/chapter-1", /绪论/],
    ["/zh/books/deconstructing_LLM/chapter-1/1-1", /1.1 是数字鹦鹉，还是自我意识/],
    ["/zh/books/deconstructing_LLM/chapter-1/1-2", /1.2 数据基础/],
    ["/zh/books/deconstructing_LLM/chapter-1/1-3", /1.3 模型结构/],
    ["/zh/books/deconstructing_LLM/chapter-1/1-4", /1.4 关于本书/],
    ["/zh/books/deconstructing_LLM/chapter-2", /数学基础——不可或缺的知识/],
    ["/zh/books/deconstructing_LLM/chapter-2/2-1", /2.1 向量、矩阵和张量/],
    ["/zh/books/deconstructing_LLM/chapter-2/2-2", /2.2 概率/],
    ["/zh/books/deconstructing_LLM/chapter-2/2-3", /2.3 微积分/],
    ["/zh/books/deconstructing_LLM/chapter-2/2-4", /2.4 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-3", /第三章：线性回归——模型之母/],
    ["/zh/books/deconstructing_LLM/chapter-3/3-1", /3.1 一个简单的例子/],
    ["/zh/books/deconstructing_LLM/chapter-3/3-2", /3.2 模型实现/],
    ["/zh/books/deconstructing_LLM/chapter-3/3-3", /3.3 模型陷阱/],
    ["/zh/books/deconstructing_LLM/chapter-3/3-4", /3.4 面向未来的准备/],
    ["/zh/books/deconstructing_LLM/chapter-3/3-5", /3.5 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-4", /第四章：逻辑回归——隐藏因子/],
    ["/zh/books/deconstructing_LLM/chapter-4/4-1", /4.1 二元分类问题：是与否/],
    ["/zh/books/deconstructing_LLM/chapter-4/4-2", /4.2 模型实现/],
    ["/zh/books/deconstructing_LLM/chapter-4/4-3", /4.3 评估模型效果/],
    ["/zh/books/deconstructing_LLM/chapter-4/4-4", /4.4 非均衡数据集/],
    ["/zh/books/deconstructing_LLM/chapter-4/4-5", /4.5 多元分类问题：超越是与否/],
    ["/zh/books/deconstructing_LLM/chapter-4/4-6", /4.6 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-5", /第五章：计量经济学的启示——他山之石/],
    ["/zh/books/deconstructing_LLM/chapter-5/5-1", /5.1 定量与定性：特征的数学运算合理吗/],
    ["/zh/books/deconstructing_LLM/chapter-5/5-2", /5.2 定性特征的处理/],
    ["/zh/books/deconstructing_LLM/chapter-5/5-3", /5.3 定量特征的处理/],
    ["/zh/books/deconstructing_LLM/chapter-5/5-4", /5.4 多重共线性：多变量的烦恼/],
    ["/zh/books/deconstructing_LLM/chapter-5/5-5", /5.5 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-6", /第六章：最优化算法——参数估计/],
    ["/zh/books/deconstructing_LLM/chapter-6/6-1", /6.1 算法思路：模拟滚动/],
    ["/zh/books/deconstructing_LLM/chapter-6/6-2", /6.2 梯度下降法/],
    ["/zh/books/deconstructing_LLM/chapter-6/6-3", /6.3 梯度下降法的代码实现/],
    ["/zh/books/deconstructing_LLM/chapter-6/6-4", /6.4 随机梯度下降法：更优化的算法/],
    ["/zh/books/deconstructing_LLM/chapter-6/6-5", /6.5 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-7", /第七章：反向传播——神经网络的工程基础/],
    ["/zh/books/deconstructing_LLM/chapter-7/7-1", /7.1 计算图和向前传播/],
    ["/zh/books/deconstructing_LLM/chapter-7/7-2", /7.2 链式法则和反向传播/],
    ["/zh/books/deconstructing_LLM/chapter-7/7-3", /7.3 参数估计的全流程/],
    ["/zh/books/deconstructing_LLM/chapter-7/7-4", /7.4 动态优化/],
    ["/zh/books/deconstructing_LLM/chapter-7/7-5", /7.5 真实世界：针对大规模模型的优化技巧/],
    ["/zh/books/deconstructing_LLM/chapter-7/7-6", /7.6 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-8", /第八章：多层感知器——神经网络的“创世记”/],
    ["/zh/books/deconstructing_LLM/chapter-8/8-1", /8.1 感知器模型/],
    ["/zh/books/deconstructing_LLM/chapter-8/8-2", /8.2 从神经网络的视角重新理解逻辑回归/],
    ["/zh/books/deconstructing_LLM/chapter-8/8-3", /8.3 多层感知器/],
    ["/zh/books/deconstructing_LLM/chapter-8/8-4", /8.4 训练优化的关键：激活函数/],
    ["/zh/books/deconstructing_LLM/chapter-8/8-5", /8.5 从第一步开始优化训练/],
    ["/zh/books/deconstructing_LLM/chapter-8/8-6", /8.6 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-9", /第九章：卷积神经网络——深度学习的“出埃及记”/],
    ["/zh/books/deconstructing_LLM/chapter-9/9-1", /9.1 利用多层感知器识别数字/],
    ["/zh/books/deconstructing_LLM/chapter-9/9-2", /9.2 卷积神经网络/],
    ["/zh/books/deconstructing_LLM/chapter-9/9-3", /9.3 残差网络/],
    ["/zh/books/deconstructing_LLM/chapter-9/9-4", /9.4 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-10", /第十章：循环神经网络——尝试理解人类语言/],
    ["/zh/books/deconstructing_LLM/chapter-10/10-1", /10.1 自然语言处理的基本要素/],
    ["/zh/books/deconstructing_LLM/chapter-10/10-2", /10.2 利用多层感知器学习语言/],
    ["/zh/books/deconstructing_LLM/chapter-10/10-3", /10.3 循环神经网络/],
    ["/zh/books/deconstructing_LLM/chapter-10/10-4", /10.4 深度循环神经网络/],
    ["/zh/books/deconstructing_LLM/chapter-10/10-5", /10.5 长短期记忆网络/],
    ["/zh/books/deconstructing_LLM/chapter-10/10-6", /10.6 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-11", /第十一章：大语言模型——是通用人工智能的开始吗/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-1", /11.1 注意力机制/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-2", /11.2 从零开始实现 GPT-2/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-3", /11.3 从大语言模型到智能助手/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-4", /11.4 模型微调/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-5", /11.5 监督微调和评分建模/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-6", /11.6 超越技术/],
    ["/zh/books/deconstructing_LLM/chapter-11/11-7", /11.7 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-12", /第十二章：强化学习——在动态交互中进化/],
    ["/zh/books/deconstructing_LLM/chapter-12/12-1", /12.1 大语言模型的持续优化/],
    ["/zh/books/deconstructing_LLM/chapter-12/12-2", /12.2 强化学习简介/],
    ["/zh/books/deconstructing_LLM/chapter-12/12-3", /12.3 值函数学习/],
    ["/zh/books/deconstructing_LLM/chapter-12/12-4", /12.4 策略学习/],
    ["/zh/books/deconstructing_LLM/chapter-12/12-5", /12.5 利用 PPO 优化大语言模型/],
    ["/zh/books/deconstructing_LLM/chapter-12/12-6", /12.6 本章小结/],
    ["/zh/books/deconstructing_LLM/chapter-13", /第十三章：其他经典模型——扩展视野/],
    ["/zh/books/deconstructing_LLM/chapter-13/13-1", /13.1 决策树/],
    ["/zh/books/deconstructing_LLM/chapter-13/13-2", /13.2 树的集成/],
    ["/zh/books/deconstructing_LLM/chapter-13/13-3", /13.3 隐马尔可夫模型/],
    ["/zh/books/deconstructing_LLM/chapter-13/13-4", /13.4 聚类与降维/],
    ["/zh/books/deconstructing_LLM/chapter-13/13-5", /13.5 奇异值分解/],
    ["/zh/books/deconstructing_LLM/chapter-13/13-6", /13.6 本章小结/],
    ["/en/books/deconstructing_LLM/chapter-1", /Chapter 1: Introduction/],
    ["/en/books/deconstructing_LLM/chapter-1/1-1", exactPattern(englishChapterOneSectionOne)],
    ["/en/books/deconstructing_LLM/chapter-1/1-2", exactPattern(englishChapterOneSectionTwo)],
    ["/en/books/deconstructing_LLM/chapter-1/1-3", exactPattern(englishChapterOneSectionThree)],
    ["/en/books/deconstructing_LLM/chapter-1/1-4", exactPattern(englishChapterOneSectionFour)],
    ["/zh/blog/watermarking_on_aigc", exactPattern(chinesePartOne)],
    ["/zh/blog/watermarking_on_aigc_2", exactPattern(chinesePartTwo)],
    ["/en/blog/watermarking_on_aigc", exactPattern(englishPartOne)],
    ["/en/blog/watermarking_on_aigc_2", exactPattern(englishPartTwo)],
  ];

  for (const [route, expected] of routes) {
    assert.match(await html(route), expected, route);
  }
});

test("keeps every published book reference explicit and normalized", async () => {
  const bookRoot = resolve("content/zh/books/deconstructing_LLM");
  const chapters = (await readdir(bookRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^chapter_\d+$/.test(entry.name));
  const explicitReference = /\[((?:第\s*\d+\s*章)|(?:\d+\.\d+(?:\.\d+)?\s*节))\]\((\/books\/deconstructing_LLM\/chapter-[^)]+)\)/g;

  for (const chapter of chapters) {
    const chapterRoot = join(bookRoot, chapter.name);
    const files = (await readdir(chapterRoot)).filter((file) => file.endsWith(".md"));
    for (const file of files) {
      const source = await readFile(join(chapterRoot, file), "utf8");
      const context = `${chapter.name}/${file}`;
      assert.deepEqual(unlinkedBookReferences(source), [], context);

      for (const match of source.matchAll(explicitReference)) {
        assert.equal(match[2], expectedBookReferenceHref(match[1]), `${context}: ${match[1]}`);
      }
    }
  }

  const renderer = await readFile(resolve("app/components/MarkdownContent.tsx"), "utf8");
  assert.match(renderer, /id: `section-\$\{id\}`/);
  assert.match(renderer, /const referencePattern = \/公式/);
  assert.doesNotMatch(renderer, /const sections =|sectionId/);
});

test("exports the concise book overview with its outline and resources", async () => {
  const source = await html("/zh/books/deconstructing_LLM");
  const overviewMarkdown = await readFile(
    resolve("content/zh/books/deconstructing_LLM/overview.md"),
    "utf8",
  );
  const bookConfig = JSON.parse(await readFile(
    resolve("content/zh/books/deconstructing_LLM/book.json"),
    "utf8",
  ));
  assert.ok(bookConfig.overview.keywords.includes("大语言模型"));
  assert.ok(bookConfig.overview.keywords.includes("Deep Learning"));
  assert.ok(bookConfig.overview.keywords.includes("模型结构"));
  assert.ok(bookConfig.overview.keywords.includes("数据基础"));
  assert.equal(Object.keys(bookConfig.chapterSeo).length, 13);
  for (const chapterId of Object.keys(bookConfig.chapterTitles)) {
    assert.ok(bookConfig.chapterSeo[chapterId]?.description, `${chapterId} should have an SEO description`);
    assert.ok(bookConfig.chapterSeo[chapterId]?.keywords.length >= 5, `${chapterId} should have focused keywords`);
  }
  assert.deepEqual(
    ["CNN", "Deep Learning"].every((keyword) => bookConfig.chapterSeo.chapter_9.keywords.includes(keyword)),
    true,
  );
  assert.deepEqual(
    ["RNN", "LSTM", "语言模型"].every((keyword) => bookConfig.chapterSeo.chapter_10.keywords.includes(keyword)),
    true,
  );
  assert.deepEqual(
    ["Attention", "Transformer", "GPT-2", "LLM"].every((keyword) => bookConfig.chapterSeo.chapter_11.keywords.includes(keyword)),
    true,
  );
  assert.deepEqual(
    ["RL", "PPO", "RLHF"].every((keyword) => bookConfig.chapterSeo.chapter_12.keywords.includes(keyword)),
    true,
  );
  assert.ok(overviewMarkdown.trim().length > 0);
  assert.match(source, /在理论基础方面/);
  assert.match(source, /READING MAP/);
  assert.match(source, /"@type":"Book"/);
  assert.match(source, /"@type":"BreadcrumbList"/);
  for (const part of bookConfig.parts) {
    assert.ok(source.includes(part.title));
    for (const chapter of part.chapters) {
      assert.match(source, new RegExp(`href="${basePath}/zh/books/deconstructing_LLM/chapter-${chapter}/"`));
    }
  }
  assert.match(source.replaceAll("<!-- -->", ""), /全书已完成 · 13 章/);
  assert.match(source, /space\.bilibili\.com\/417265639\/lists\/3138772/);
  assert.match(source, /https:\/\/github\.com\/GenTang\/regression2chatgpt/);
  const outlineImageSrc = source.match(
    new RegExp(`src="(${basePath}/_next/static/media/deconstructing-llm-outline\\.[^"]+\\.webp)"`),
  )?.[1];
  assert.ok(outlineImageSrc, "the overview should use the outline image imported from its content directory");
  assert.doesNotMatch(source, /从基础模型，一直走到智能系统|三个部分构成一条连续的学习路径/);
  assert.doesNotMatch(source, /在线目录|完整图书介绍|已上线|准备中/);
  await access(resolve("content/zh/books/deconstructing_LLM/deconstructing-llm-outline.webp"));
  await access(join(outputRoot, outlineImageSrc.slice(basePath.length).replace(/^\//, "")));
});

test("exports the English book overview with its own content and outline", async () => {
  const [source, englishHome] = await Promise.all([
    html("/en/books/deconstructing_LLM"),
    html("/en"),
  ]);
  const overviewMarkdown = await readFile(
    resolve("content/en/books/deconstructing_LLM/overview.md"),
    "utf8",
  );
  const bookConfig = JSON.parse(await readFile(
    resolve("content/en/books/deconstructing_LLM/book.json"),
    "utf8",
  ));

  assert.ok(overviewMarkdown.trim().length > 0);
  assert.match(source, /theoretical foundations/);
  assert.match(source, /engineering implementation/);
  assert.match(source, /READING MAP/);
  assert.match(source, /"@type":"Book"/);
  for (const part of bookConfig.parts) assert.ok(source.includes(part.title));
  assert.match(source.replaceAll("<!-- -->", ""), /Book complete · 13 chapters/);
  assert.match(source, new RegExp(`src="${basePath}/images/deconstructing-llm-cover-en\\.webp"`));
  assert.match(source, new RegExp(`href="${basePath}/en/books/deconstructing_LLM/chapter-1/"`));
  assert.match(source, new RegExp(`href="${basePath}/en/books/deconstructing_LLM/chapter-13/"`));
  assert.doesNotMatch(source, /Video Series|space\.bilibili\.com/);
  assert.match(source, /https:\/\/github\.com\/GenTang\/regression2chatgpt\/tree\/en/);
  assert.ok(source.includes(`rel="canonical" href="${publicUrl("/en/books/deconstructing_LLM")}"`));
  assert.ok(source.includes(`hrefLang="zh-CN" href="${publicUrl("/zh/books/deconstructing_LLM")}"`));
  assert.match(englishHome, new RegExp(`href="${basePath}/en/books/deconstructing_LLM/"`));

  const outlineImageSrc = source.match(
    new RegExp(`src="(${basePath}/_next/static/media/deconstructing-llm-outline\\.[^"]+\\.webp)"`),
  )?.[1];
  assert.ok(outlineImageSrc, "the English overview should use its own outline image");
  await access(resolve("content/en/books/deconstructing_LLM/deconstructing-llm-outline.webp"));
  await access(join(outputRoot, outlineImageSrc.slice(basePath.length).replace(/^\//, "")));
});

test("derives the two-level book navigation from content files", async () => {
  const source = await html("/zh/books/deconstructing_LLM/chapter-1");
  assert.doesNotMatch(source, />概览</);
  assert.match(source, /第一章：绪论/);
  assert.match(source, /第二章：数学基础——不可或缺的知识/);
  assert.match(source, /第三章：线性回归——模型之母/);
  assert.match(source, /第四章：逻辑回归——隐藏因子/);
  assert.match(source, /第五章：计量经济学的启示——他山之石/);
  assert.match(source, /第六章：最优化算法——参数估计/);
  assert.match(source, /第七章：反向传播——神经网络的工程基础/);
  assert.match(source, /第八章：多层感知器——神经网络的“创世记”/);
  assert.match(source, /第九章：卷积神经网络——深度学习的“出埃及记”/);
  assert.match(source, /第十二章：强化学习——在动态交互中进化/);
  assert.match(source, /第十三章：其他经典模型——扩展视野/);
  assert.doesNotMatch(source, />← 全书总览<|<span class="sidebar-label">全书目录<\/span>/);
  assert.match(source, /全部展开/);
  assert.match(source, /全部收起/);
  assert.match(source, new RegExp(`href="${basePath}/zh/books/deconstructing_LLM/chapter-1/1-4/"`));
  assert.match(source, /下一节.*1\.1 是数字鹦鹉，还是自我意识/s);
  assert.match(source, /<details class="toc-chapter is-open"[^>]*open/);
  assert.match(source, /<details class="toc-chapter"[^>]*>/);

  const [english, englishChapterOneSectionOne] = await Promise.all([
    html("/en/books/deconstructing_LLM/chapter-1"),
    bookSectionTitle("en", 1, "1_1"),
  ]);
  assert.doesNotMatch(english, /Begin with the question/);
  assert.match(english, /Deconstructing Large Language Models/);
  assert.match(english, /Chapter 1: Introduction/);
  assert.match(english, new RegExp(`href="${basePath}/en/books/deconstructing_LLM/chapter-1/1-4/"`));
  assert.match(english, new RegExp(`Next.*${exactPattern(englishChapterOneSectionOne).source}`, "s"));
  assert.match(english, /Expand all/);
  assert.match(english, /Collapse all/);
  assert.doesNotMatch(english, /Models and representations|The role of context/);
});

test("exports formulas, footnotes, chapter images, and their anchors", async () => {
  const overview = await html("/zh/books/deconstructing_LLM/chapter-1");
  assert.match(overview, /id="user-content-fnref-1"[^>]*data-footnote-ref="true"/);
  assert.match(overview, /href="#user-content-fnref-1"[^>]*data-footnote-backref/);
  assert.match(overview, /id="comments-title">评论与讨论<\/h2>/);
  assert.doesNotMatch(overview, /加载评论|GitHub Discussions 提供/);
  assert.doesNotMatch(overview, /安装 Giscus App/);

  const publishedBlog = await html("/zh/blog/watermarking_on_aigc");
  const synthIdBlog = await html("/zh/blog/watermarking_on_aigc_2");
  const englishBlog = await html("/en/blog/watermarking_on_aigc");
  const englishSynthIdBlog = await html("/en/blog/watermarking_on_aigc_2");
  const markdown = await readFile(resolve("content/zh/blog/watermarking_on_aigc/watermarking_on_aigc.md"), "utf8");
  const synthIdMarkdown = await readFile(resolve("content/zh/blog/watermarking_on_aigc_2/watermarking_on_aigc_2.md"), "utf8");
  const englishMarkdown = await readFile(resolve("content/en/blog/watermarking_on_aigc/watermarking_on_aigc.md"), "utf8");
  const englishSynthIdMarkdown = await readFile(resolve("content/en/blog/watermarking_on_aigc_2/watermarking_on_aigc_2.md"), "utf8");
  const markdownTitle = markdown.match(/^#\s+(.+?)\s*$/m)?.[1];
  const markdownSummary = markdown.match(/^summary:\s*(.+?)\s*$/m)?.[1];
  const synthIdPublished = synthIdMarkdown.match(/^published:\s*(.+?)\s*$/m)?.[1];
  const englishTitle = englishMarkdown.match(/^#\s+(.+?)\s*$/m)?.[1];
  const englishSummary = englishMarkdown.match(/^summary:\s*(.+?)\s*$/m)?.[1];
  const englishSynthIdTitle = englishSynthIdMarkdown.match(/^#\s+(.+?)\s*$/m)?.[1];
  const englishSynthIdSummary = englishSynthIdMarkdown.match(/^summary:\s*(.+?)\s*$/m)?.[1];
  assert.match(publishedBlog, /id="comments-title">评论与讨论<\/h2>/);
  assert.match(publishedBlog, new RegExp(`src="${basePath}/generated/blog-images/zh/watermarking_on_aigc/pic/p-1\\.webp"`));
  assert.ok(publishedBlog.includes(`<header class="article-header"><h1>${markdownTitle}</h1><p>${markdownSummary}</p><div class="article-meta"><time dateTime="2026-08-17">2026-08-17</time><span>约 15 分钟阅读</span></div></header>`));
  assert.doesNotMatch(publishedBlog, /article-kicker|draft-notice|article-endmark|BLOG · 001|前沿笔记/);
  assert.match(publishedBlog, /class="code-listing-title"/);
  assert.match(synthIdBlog, /id="comments-title">评论与讨论<\/h2>/);
  assert.match(synthIdBlog, new RegExp(`src="${basePath}/generated/blog-images/zh/watermarking_on_aigc_2/pic/p-1\\.webp"`));
  assert.ok(synthIdBlog.includes(`property="article:published_time" content="${synthIdPublished}"`));
  assert.match(englishBlog, new RegExp(`src="${basePath}/generated/blog-images/en/watermarking_on_aigc/pic/p-1\\.webp"`));
  assert.ok(englishBlog.includes(`<header class="article-header"><h1>${englishTitle}</h1><p>${englishSummary}</p><div class="article-meta"><time dateTime="2026-08-17">2026-08-17</time><span>About 15 minutes</span></div></header>`));
  assert.match(englishBlog, /Key Takeaways \/ TL;DR/);
  assert.match(englishBlog, /class="code-listing-title"/);
  assert.match(englishSynthIdBlog, new RegExp(`src="${basePath}/generated/blog-images/en/watermarking_on_aigc_2/pic/p-1\\.webp"`));
  assert.ok(englishSynthIdBlog.includes(`<header class="article-header"><h1>${englishSynthIdTitle}</h1><p>${englishSynthIdSummary}</p><div class="article-meta"><time dateTime="2026-08-20">2026-08-20</time><span>About 25 minutes</span></div></header>`));
  assert.match(englishSynthIdBlog, /Key Takeaways \/ TL;DR/);
  assert.match(englishSynthIdBlog, /class="code-listing-title"/);

  const outlineStart = publishedBlog.indexOf('<nav aria-label="文章目录">');
  const outline = publishedBlog.slice(outlineStart, publishedBlog.indexOf("</nav>", outlineStart));
  const slugs = new Map();
  const expectedOutline = [...markdown.matchAll(/^(#{2,3})\s+(.+?)\s*$/gm)].map((match) => {
    const label = match[2].replace(/\[([^\]]+)]\([^)]+\)/g, "$1").replace(/[*_`~]/g, "").trim();
    const base = label.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, "-");
    const duplicate = slugs.get(base) ?? 0;
    slugs.set(base, duplicate + 1);
    return [duplicate ? `#${base}-${duplicate}` : `#${base}`, label];
  });
  const renderedOutline = [...outline.matchAll(/<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
    .map((match) => [match[1], match[2]]);
  assert.deepEqual(renderedOutline, expectedOutline);

  const vectors = await html("/zh/books/deconstructing_LLM/chapter-2/2-1");
  assert.match(vectors, /id="eq-2-1"/);
  assert.match(vectors, /href="#eq-2-1">公式（2-1）<\/a>/);
  assert.match(vectors, /id="section-2-1-3"/);

  const englishVectors = await html("/en/books/deconstructing_LLM/chapter-2/2-1");
  assert.match(englishVectors, /id="eq-2-9"/);
  assert.match(englishVectors, /href="#eq-2-9">Equation \(2-9\)<\/a>/);
  assert.match(englishVectors, /href="#eq-2-15">Equation \(2-15\)<\/a>/);

  const englishCalculus = await html("/en/books/deconstructing_LLM/chapter-2/2-3");
  assert.match(englishCalculus, /href="#eq-2-50">Equations \(2-50\)<\/a>/);
  assert.match(englishCalculus, /href="#eq-2-51">\(2-51\)<\/a>/);

  const chapterOne = await html("/zh/books/deconstructing_LLM/chapter-1/1-1");
  assert.match(chapterOne, new RegExp(`src="${basePath}/generated/book-images/chapter_1/1-1\\.webp"`));
  assert.match(chapterOne, /<figcaption>[^<]+<\/figcaption>/);
  await access(join(outputRoot, "generated", "book-images", "chapter_1", "1-1.webp"));
  const englishChapterOne = await html("/en/books/deconstructing_LLM/chapter-1/1-1");
  assert.match(
    englishChapterOne,
    new RegExp(`src="${basePath}/generated/book-images/en/chapter_1/1-1\\.webp"`),
  );
  assert.match(englishChapterOne, /<figcaption>Figure 1-1<\/figcaption>/);
  assert.match(englishChapterOne, /Footnotes/);
  await access(join(outputRoot, "generated", "book-images", "en", "chapter_1", "1-1.webp"));
  await access(join(outputRoot, "generated", "book-images", "chapter_2", "2-15.webp"));
  const chapterThree = await html("/zh/books/deconstructing_LLM/chapter-3/3-1");
  assert.match(chapterThree, /id="eq-3-1"/);
  assert.match(chapterThree, new RegExp(`src="${basePath}/generated/book-images/chapter_3/3-1[.]webp"`));
  assert.match(
    chapterThree,
    new RegExp(`href="${basePath}/zh/books/deconstructing_LLM/chapter-3/3-2/#section-3-2-2"`),
  );
  assert.doesNotMatch(chapterThree, /chapter-2\/3-2/);

  const implementation = await html("/zh/books/deconstructing_LLM/chapter-3/3-2");
  assert.match(implementation, /class="code-line" data-line-number="1"/);
  assert.match(implementation, /class="code-line" data-line-number="20"/);
  assert.match(implementation, /class="code-line" data-line-number="24"/);
  assert.match(implementation, /class="code-listing-title"/);
  assert.match(
    implementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch03_linear\/linear_ml\.ipynb/,
  );
  assert.match(
    implementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch03_linear\/linear_stat\.ipynb/,
  );

  const englishImplementation = await html("/en/books/deconstructing_LLM/chapter-3/3-2");
  assert.match(englishImplementation, /class="code-listing-title"/);
  assert.match(englishImplementation, /Listing 3-1 Linear Regression/);
  assert.match(
    englishImplementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch03_linear\/linear_ml\.ipynb/,
  );
  assert.match(
    englishImplementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch03_linear\/linear_stat\.ipynb/,
  );

  const chapterFour = await html("/zh/books/deconstructing_LLM/chapter-4/4-1");
  assert.match(chapterFour, /id="eq-4-1"/);
  assert.match(chapterFour, new RegExp(`src="${basePath}/generated/book-images/chapter_4/4-1[.]webp"`));

  const chapterFourImplementation = await html("/zh/books/deconstructing_LLM/chapter-4/4-2");
  assert.match(chapterFourImplementation, /程序清单 4-1/);
  assert.match(chapterFourImplementation, /class="code-line" data-line-number="10"/);
  assert.match(
    chapterFourImplementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch04_logit\/logit_regression\.ipynb/,
  );

  const englishChapterFour = await html("/en/books/deconstructing_LLM/chapter-4/4-1");
  assert.match(englishChapterFour, /id="eq-4-1"/);
  assert.match(englishChapterFour, /href="#eq-4-1">Equation \(4-1\)<\/a>/);
  assert.match(
    englishChapterFour,
    new RegExp(`src="${basePath}/generated/book-images/en/chapter_4/4-1[.]webp"`),
  );

  const englishChapterFourImplementation = await html("/en/books/deconstructing_LLM/chapter-4/4-2");
  assert.match(englishChapterFourImplementation, /class="code-listing-title"/);
  assert.match(englishChapterFourImplementation, /Listing 4-1 Logistic Regression/);
  assert.match(
    englishChapterFourImplementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch04_logit\/logit_regression\.ipynb/,
  );
  assert.doesNotMatch(englishChapterFourImplementation, /regression2chatgpt\/blob\/zh\//);

  for (const section of ["4_1", "4_2", "4_3", "4_4", "4_5", "4_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_4/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterFive = await html("/zh/books/deconstructing_LLM/chapter-5/5-2");
  assert.match(chapterFive, /id="eq-5-1"/);
  assert.match(chapterFive, new RegExp(`src="${basePath}/generated/book-images/chapter_5/5-2[.]webp"`));
  assert.match(
    chapterFive,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch05_econometrics\/categorical_variable\.ipynb/,
  );

  const chapterFiveCollinearity = await html("/zh/books/deconstructing_LLM/chapter-5/5-4");
  assert.match(chapterFiveCollinearity, /<p class="table-title">表 5-1<\/p>/);
  assert.match(
    chapterFiveCollinearity,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch05_econometrics\/multicollinearity\.ipynb/,
  );

  const englishChapterFive = await html("/en/books/deconstructing_LLM/chapter-5/5-2");
  assert.match(englishChapterFive, /id="eq-5-1"/);
  assert.match(englishChapterFive, /href="#eq-5-1">Equation \(5-1\)<\/a>/);
  assert.match(
    englishChapterFive,
    new RegExp(`src="${basePath}/generated/book-images/en/chapter_5/5-2[.]webp"`),
  );
  assert.match(
    englishChapterFive,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch05_econometrics\/categorical_variable\.ipynb/,
  );

  const englishChapterFiveCollinearity = await html("/en/books/deconstructing_LLM/chapter-5/5-4");
  assert.match(englishChapterFiveCollinearity, /<p class="table-title">Table 5-1<\/p>/);
  assert.match(
    englishChapterFiveCollinearity,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch05_econometrics\/multicollinearity\.ipynb/,
  );
  assert.doesNotMatch(englishChapterFiveCollinearity, /regression2chatgpt\/blob\/zh\//);

  for (const section of ["5_1", "5_2", "5_3", "5_4", "5_5"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_5/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterSix = await html("/zh/books/deconstructing_LLM/chapter-6/6-3");
  assert.match(chapterSix, /程序清单 6-1/);
  assert.match(chapterSix, /程序清单 6-5/);
  assert.match(chapterSix, /class="code-line" data-line-number="33"/);
  assert.match(
    chapterSix,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch06_optimizer\/gradient_descent\.ipynb/,
  );

  const chapterSixSgd = await html("/zh/books/deconstructing_LLM/chapter-6/6-4");
  assert.match(chapterSixSgd, /id="eq-6-7"/);
  assert.match(chapterSixSgd, /程序清单 6-6/);
  assert.match(
    chapterSixSgd,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch06_optimizer\/stochastic_gradient_descent\.ipynb/,
  );

  const englishChapterSix = await html("/en/books/deconstructing_LLM/chapter-6/6-1");
  assert.match(englishChapterSix, /id="eq-6-1"/);
  assert.match(englishChapterSix, /href="#eq-6-1">Equation \(6-1\)<\/a>/);
  assert.match(
    englishChapterSix,
    new RegExp(`src="${basePath}/generated/book-images/en/chapter_6/6-1[.]webp"`),
  );

  const englishChapterSixImplementation = await html("/en/books/deconstructing_LLM/chapter-6/6-3");
  assert.match(englishChapterSixImplementation, /Listing 6-1 Creating Tensors/);
  assert.match(englishChapterSixImplementation, /Listing 6-5 Gradient Descent/);
  assert.match(englishChapterSixImplementation, /class="code-line" data-line-number="33"/);
  assert.match(
    englishChapterSixImplementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch06_optimizer\/gradient_descent\.ipynb/,
  );

  const englishChapterSixSgd = await html("/en/books/deconstructing_LLM/chapter-6/6-4");
  assert.match(englishChapterSixSgd, /id="eq-6-7"/);
  assert.match(englishChapterSixSgd, /href="#eq-6-7">Equation \(6-7\)<\/a>/);
  assert.match(englishChapterSixSgd, /Listing 6-6 Stochastic Gradient Descent/);
  assert.match(
    englishChapterSixSgd,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch06_optimizer\/stochastic_gradient_descent\.ipynb/,
  );
  assert.doesNotMatch(englishChapterSixSgd, /regression2chatgpt\/blob\/zh\//);

  for (const section of ["6_1", "6_2", "6_3", "6_4", "6_5"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_6/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }

  const chapterSevenAutograd = await html("/zh/books/deconstructing_LLM/chapter-7/7-2");
  assert.match(chapterSevenAutograd, /id="eq-7-1"/);
  assert.match(chapterSevenAutograd, /href="#eq-7-1">公式（7-1）<\/a>/);
  assert.match(chapterSevenAutograd, /程序清单 7-3/);
  assert.match(chapterSevenAutograd, /程序清单 7-5/);
  assert.match(chapterSevenAutograd, /class="code-line" data-line-number="41"/);
  assert.match(
    chapterSevenAutograd,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch07_autograd\/utils\.py/,
  );

  const chapterSevenGpu = await html("/zh/books/deconstructing_LLM/chapter-7/7-5");
  assert.match(chapterSevenGpu, /程序清单 7-9/);
  assert.match(chapterSevenGpu, /class="code-line" data-line-number="16"/);
  assert.match(
    chapterSevenGpu,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch07_autograd\/gpu\.ipynb/,
  );

  const englishChapterSevenAutograd = await html("/en/books/deconstructing_LLM/chapter-7/7-2");
  assert.match(englishChapterSevenAutograd, /id="eq-7-1"/);
  assert.match(englishChapterSevenAutograd, /href="#eq-7-1">Equation \(7-1\)<\/a>/);
  assert.match(englishChapterSevenAutograd, /Listing 7-3 Defining the Partial Derivatives/);
  assert.match(englishChapterSevenAutograd, /Listing 7-5 Forward Pass and Backpropagation/);
  assert.match(englishChapterSevenAutograd, /class="code-line" data-line-number="41"/);
  assert.match(
    englishChapterSevenAutograd,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch07_autograd\/utils\.py/,
  );
  assert.match(
    englishChapterSevenAutograd,
    new RegExp(`src="${basePath}/generated/book-images/en/chapter_7/7-4[.]webp"`),
  );

  const englishChapterSevenGpu = await html("/en/books/deconstructing_LLM/chapter-7/7-5");
  assert.match(englishChapterSevenGpu, /Listing 7-9 GPU Computing/);
  assert.match(englishChapterSevenGpu, /class="code-line" data-line-number="16"/);
  assert.match(
    englishChapterSevenGpu,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/en\/ch07_autograd\/gpu\.ipynb/,
  );
  assert.doesNotMatch(englishChapterSevenGpu, /regression2chatgpt\/blob\/zh\//);

  for (const section of ["7_1", "7_2", "7_3", "7_4", "7_5", "7_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_7/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }

  const chapterEightPerceptron = await html("/zh/books/deconstructing_LLM/chapter-8/8-1");
  assert.match(chapterEightPerceptron, /id="eq-8-1"/);
  assert.match(chapterEightPerceptron, /id="eq-8-10"/);
  assert.match(chapterEightPerceptron, /href="#eq-8-8">公式（8-8）<\/a>/);
  assert.match(
    chapterEightPerceptron,
    new RegExp(`src="${basePath}/generated/book-images/chapter_8/8-1[.]webp"`),
  );

  const chapterEightLogit = await html("/zh/books/deconstructing_LLM/chapter-8/8-2");
  assert.match(chapterEightLogit, /程序清单 8-1/);
  assert.match(chapterEightLogit, /程序清单 8-2/);
  assert.match(chapterEightLogit, /class="code-line" data-line-number="57"/);
  assert.match(
    chapterEightLogit,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch08_mlp\/logit_regression\.ipynb/,
  );

  const chapterEightTraining = await html("/zh/books/deconstructing_LLM/chapter-8/8-5");
  assert.match(chapterEightTraining, /id="eq-8-16"/);
  assert.match(chapterEightTraining, /程序清单 8-6/);
  assert.match(chapterEightTraining, /程序清单 8-8/);
  assert.match(chapterEightTraining, /class="code-line" data-line-number="26"/);
  assert.match(
    chapterEightTraining,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch08_mlp\/normalization\.ipynb/,
  );

  for (const section of ["8_1", "8_2", "8_3", "8_4", "8_5", "8_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_8/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  await access(join(outputRoot, "generated", "book-images", "chapter_3", "3-23.webp"));
  await access(join(outputRoot, "generated", "book-images", "chapter_4", "4-24.webp"));
  await access(join(outputRoot, "generated", "book-images", "chapter_5", "5-13.webp"));
  await access(join(outputRoot, "generated", "book-images", "chapter_6", "6-9.webp"));
  await access(join(outputRoot, "generated", "book-images", "chapter_7", "7-28.webp"));
  await access(join(outputRoot, "generated", "book-images", "chapter_8", "8-33.webp"));
  const chapterNine = await html("/zh/books/deconstructing_LLM/chapter-9/9-1");
  assert.match(chapterNine, /程序清单 9-1/);
  assert.match(chapterNine, /class="code-line" data-line-number="27"/);
  assert.match(chapterNine, /href="#eq-9-1">公式（9-1）<\/a>/);
  assert.match(
    chapterNine,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch09_cnn\/mlp\.ipynb/,
  );
  const chapterNineCnn = await html("/zh/books/deconstructing_LLM/chapter-9/9-2");
  assert.match(chapterNineCnn, /id="eq-9-4"/);
  assert.match(chapterNineCnn, /程序清单 9-5/);
  assert.match(
    chapterNineCnn,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch09_cnn\/cnn\.ipynb/,
  );
  const chapterNineResNet = await html("/zh/books/deconstructing_LLM/chapter-9/9-3");
  assert.match(chapterNineResNet, /程序清单 9-6/);
  assert.match(
    chapterNineResNet,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch09_cnn\/res_nets\.ipynb/,
  );
  for (const section of ["9_1", "9_2", "9_3", "9_4"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_9/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterTen = await html("/zh/books/deconstructing_LLM/chapter-10/10-5");
  assert.match(chapterTen, /id="eq-10-1"/);
  assert.match(chapterTen, /href="#eq-10-1">公式（10-1）<\/a>/);
  assert.match(chapterTen, /程序清单 10-8/);
  assert.match(chapterTen, /程序清单 10-9/);
  assert.match(chapterTen, /class="code-line" data-line-number="30"/);
  assert.match(
    chapterTen,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch10_rnn\/lstm\.ipynb/,
  );
  for (const section of ["10_1", "10_2", "10_3", "10_4", "10_5", "10_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_10/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterElevenOverview = await html("/zh/books/deconstructing_LLM/chapter-11");
  assert.match(
    chapterElevenOverview,
    new RegExp(`src="${basePath}/generated/book-images/chapter_11/11-1[.]webp"`),
  );
  const chapterElevenAttention = await html("/zh/books/deconstructing_LLM/chapter-11/11-1");
  assert.match(chapterElevenAttention, /id="eq-11-1"/);
  assert.match(chapterElevenAttention, /href="#eq-11-1">公式（11-1）<\/a>/);
  assert.match(
    chapterElevenAttention,
    new RegExp(`src="${basePath}/generated/book-images/chapter_11/11-2[.]webp"`),
  );
  const chapterElevenGpt = await html("/zh/books/deconstructing_LLM/chapter-11/11-2");
  assert.match(chapterElevenGpt, /程序清单 11-1/);
  assert.match(chapterElevenGpt, /程序清单 11-3/);
  assert.match(chapterElevenGpt, /class="code-line" data-line-number="23"/);
  assert.match(
    chapterElevenGpt,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch11_llm\/char_gpt\.ipynb/,
  );
  const chapterElevenTuning = await html("/zh/books/deconstructing_LLM/chapter-11/11-4");
  assert.match(chapterElevenTuning, /程序清单 11-4/);
  assert.match(
    chapterElevenTuning,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch11_llm\/lora_tutorial\.ipynb/,
  );
  const chapterElevenReward = await html("/zh/books/deconstructing_LLM/chapter-11/11-5");
  assert.match(chapterElevenReward, /程序清单 11-5/);
  assert.match(chapterElevenReward, /程序清单 11-6/);
  assert.match(chapterElevenReward, /class="code-line" data-line-number="30"/);
  assert.match(
    chapterElevenReward,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch11_llm\/gpt2_reward_modeling\.ipynb/,
  );
  for (const section of ["11_1", "11_2", "11_3", "11_4", "11_5", "11_6", "11_7"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_11/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterTwelveOptimization = await html("/zh/books/deconstructing_LLM/chapter-12/12-1");
  assert.match(chapterTwelveOptimization, /id="eq-12-1"/);
  assert.match(chapterTwelveOptimization, /href="#eq-12-1">公式（12-1）<\/a>/);
  assert.match(chapterTwelveOptimization, /程序清单 12-1/);
  assert.match(chapterTwelveOptimization, /class="code-line" data-line-number="33"/);
  assert.match(
    chapterTwelveOptimization,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch12_rl\/intuition_model\.ipynb/,
  );
  const chapterTwelveValue = await html("/zh/books/deconstructing_LLM/chapter-12/12-3");
  assert.match(chapterTwelveValue, /id="eq-12-13"/);
  assert.match(chapterTwelveValue, /程序清单 12-2/);
  assert.match(chapterTwelveValue, /class="code-line" data-line-number="17"/);
  const chapterTwelvePolicy = await html("/zh/books/deconstructing_LLM/chapter-12/12-4");
  assert.match(chapterTwelvePolicy, /程序清单 12-3/);
  assert.match(chapterTwelvePolicy, /class="code-line" data-line-number="14"/);
  const chapterTwelvePpo = await html("/zh/books/deconstructing_LLM/chapter-12/12-5");
  assert.match(chapterTwelvePpo, /id="eq-12-23"/);
  assert.match(chapterTwelvePpo, /程序清单 12-4/);
  assert.match(chapterTwelvePpo, /程序清单 12-5/);
  assert.match(chapterTwelvePpo, /class="code-line" data-line-number="28"/);
  assert.match(
    chapterTwelvePpo,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch12_rl\/llm_ppo\.ipynb/,
  );
  for (const section of ["12_1", "12_2", "12_3", "12_4", "12_5", "12_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_12/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterThirteenTree = await html("/zh/books/deconstructing_LLM/chapter-13/13-1");
  assert.match(chapterThirteenTree, /id="eq-13-1"/);
  assert.match(chapterThirteenTree, /href="#eq-13-2">公式（13-2）<\/a>/);
  assert.match(
    chapterThirteenTree,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch13_others\/dt_logit\.ipynb/,
  );
  const chapterThirteenEnsemble = await html("/zh/books/deconstructing_LLM/chapter-13/13-2");
  assert.match(chapterThirteenEnsemble, /id="eq-13-10"/);
  assert.match(
    chapterThirteenEnsemble,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch13_others\/gbts\.ipynb/,
  );
  const chapterThirteenHmm = await html("/zh/books/deconstructing_LLM/chapter-13/13-3");
  assert.match(chapterThirteenHmm, /id="eq-13-17"/);
  assert.match(
    chapterThirteenHmm,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch13_others\/viterbipy\.py/,
  );
  const chapterThirteenUnsupervised = await html("/zh/books/deconstructing_LLM/chapter-13/13-4");
  assert.match(chapterThirteenUnsupervised, /id="eq-13-24"/);
  assert.match(
    chapterThirteenUnsupervised,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch13_others\/pca\.ipynb/,
  );
  const chapterThirteenSvd = await html("/zh/books/deconstructing_LLM/chapter-13/13-5");
  assert.match(chapterThirteenSvd, /id="eq-13-28"/);
  assert.match(
    chapterThirteenSvd,
    new RegExp(`src="${basePath}/generated/book-images/chapter_13/13-28[.]webp"`),
  );
  for (const section of ["13_1", "13_2", "13_3", "13_4", "13_5", "13_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_13/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const bookRoot = resolve("content/zh/books/deconstructing_LLM");
  const chapterDirectories = (await readdir(bookRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && /^chapter_\d+$/.test(entry.name));
  for (const chapter of chapterDirectories) {
    const chapterRoot = join(bookRoot, chapter.name);
    const markdownFiles = (await readdir(chapterRoot)).filter((file) => file.endsWith(".md"));
    for (const markdownFile of markdownFiles) {
      const markdown = await readFile(join(chapterRoot, markdownFile), "utf8");
      for (const match of markdown.matchAll(/!\[[^\]]*\]\(\.\/images\/([^)]+)\)/g)) {
        await access(join(outputRoot, "generated", "book-images", chapter.name, match[1]));
      }
    }
  }
  await access(join(outputRoot, ".nojekyll"));
});

test("keeps mobile navigation compact and long-form content scrollable", async () => {
  const home = await html("/zh/");
  const reading = await html("/zh/books/deconstructing_LLM/chapter-4/4-2");
  const styles = await readFile(resolve("app/globals.css"), "utf8");
  const header = await readFile(resolve("app/components/SiteHeader.tsx"), "utf8");
  const tocScroller = await readFile(resolve("app/components/ActiveTocScroller.tsx"), "utf8");
  const tocControls = await readFile(resolve("app/components/BookTocControls.tsx"), "utf8");

  assert.match(home, /mobile-menu-button/);
  assert.match(reading, /<aside class="mobile-reading-sidebar"><details>/);
  assert.match(reading, /aria-current="page"/);
  assert.match(reading, /<p class="table-title">表 4-1<\/p>/);
  assert.match(reading, /class="markdown-table-scroll"/);
  assert.match(header, /className="mobile-nav-language"/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /\.mobile-reading-sidebar-panel/);
  assert.match(styles, /\.reading-sidebar \.book-toc\s*{[^}]*padding-bottom:/s);
  assert.match(styles, /\.markdown-content \.table-title/);
  assert.match(styles, /\.markdown-table-scroll table\s*{\s*min-width: 560px/);
  assert.match(styles, /\.markdown-content \.katex-display > \.katex > \.katex-html\s*{\s*padding-inline: 34px/);
  assert.match(tocScroller, /currentRect\.top[\s\S]*container\.clientHeight - currentRect\.height/);
  assert.match(tocScroller, /container\.scrollTo\(/);
  assert.match(tocScroller, /mobileDetails\?\.addEventListener\("toggle"/);
  assert.match(tocControls, /querySelectorAll<HTMLDetailsElement>\("\.toc-chapter"\)/);
  assert.match(tocControls, /useLayoutEffect/);
  assert.match(tocControls, /openChapterIds\.add\(currentChapterId\)/);
  assert.match(tocControls, /detail\.open = open/);
  assert.match(tocControls, /sessionStorage\.setItem/);
});
