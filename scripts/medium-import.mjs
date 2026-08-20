import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import MathJax from "@mathjax/src";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import sharp from "sharp";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const contentRoot = join(projectRoot, "content");
const defaultConfigPath = join(projectRoot, "medium-import.json");
const defaultOutputRoot = join(projectRoot, "out");
const defaultSiteUrl = "https://gentang.github.io/";
const mediumAssetVersion = "v2";
const mediumFormulaCanvasWidth = 760;

let mathJaxReady;

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isWithin(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

function normalizeSiteUrl(value) {
  const url = new URL(value || defaultSiteUrl);
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function normalizedSelector(input) {
  return input.replace(/^\/+|\/+$/g, "");
}

function selectorCandidates(input) {
  if (isAbsolute(input) && isWithin(contentRoot, resolve(input))) return [resolve(input)];
  const normalized = normalizedSelector(input);
  const candidates = [];

  if (normalized.startsWith("content/")) {
    candidates.push(resolve(projectRoot, normalized));
  } else {
    const parts = normalized.split("/");
    const [language, section, slug, chapterPart, sectionPart] = parts;

    if (["en", "zh"].includes(language) && section === "blog" && slug && parts.length === 3) {
      candidates.push(
        join(contentRoot, language, "blog", slug, `${slug}.md`),
        join(contentRoot, language, "blog", `${slug}.md`),
      );
    }

    if (["en", "zh"].includes(language) && section === "books" && slug) {
      const bookRoot = join(contentRoot, language, "books", slug);
      if (parts.length === 3) candidates.push(join(bookRoot, "overview.md"));
      if (/^chapter[-_]\d+$/.test(chapterPart ?? "")) {
        const chapterNumber = chapterPart.match(/\d+$/)?.[0];
        const chapterRoot = join(bookRoot, `chapter_${chapterNumber}`);
        if (parts.length === 4) candidates.push(chapterRoot);
        if (sectionPart && parts.length === 5) candidates.push(join(chapterRoot, `${sectionPart.replaceAll("-", "_")}.md`));
      }
    }

    candidates.push(resolve(contentRoot, normalized));
  }

  return [...new Set(candidates)];
}

export async function resolveMediumSource(input) {
  if (!input) throw new Error("请提供一篇博客，例如 en/blog/watermarking_on_aigc");

  const normalized = normalizedSelector(input);
  const slug = basename(normalized);
  const bases = selectorCandidates(input);
  const candidates = [...bases];
  for (const base of bases) {
    if (!normalized.endsWith(".md")) {
      candidates.push(`${base}.md`, join(base, `${slug}.md`), join(base, "overview.md"), join(base, "index.md"));
    }
  }

  for (const candidate of candidates) {
    if (!(await exists(candidate)) || extname(candidate).toLowerCase() !== ".md") continue;
    if (!isWithin(contentRoot, candidate)) throw new Error("Medium 临时页只允许读取 content/ 中的 Markdown");
    return candidate;
  }

  throw new Error(`找不到博客 Markdown：${input}`);
}

export function mediumSourceConfigValue(sourcePath) {
  return relative(projectRoot, sourcePath).split(sep).join("/");
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "en", { numeric: true }))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") files.push(path);
  }
  return files;
}

export async function resolveMediumSources(selectors = [], { all = false } = {}) {
  const candidates = [];
  if (all) {
    for (const language of ["zh", "en"]) {
      for (const section of ["blog", "books"]) {
        const root = join(contentRoot, language, section);
        if (await exists(root)) candidates.push(...await markdownFiles(root));
      }
    }
  } else {
    if (selectors.length === 0) throw new Error("请提供至少一个 Markdown 文件或目录，或者使用 --all");
    for (const selector of selectors) {
      let directory;
      for (const candidate of selectorCandidates(selector)) {
        try {
          const entries = await readdir(candidate, { withFileTypes: true });
          if (entries) {
            directory = candidate;
            break;
          }
        } catch (error) {
          if (!["ENOENT", "ENOTDIR"].includes(error?.code)) throw error;
        }
      }
      if (!directory) {
        candidates.push(await resolveMediumSource(selector));
        continue;
      }
      if (!isWithin(contentRoot, directory)) throw new Error("Medium 临时页只允许读取 content/ 中的目录");
      candidates.push(...await markdownFiles(directory));
    }
  }

  return [...new Map(candidates.map((path) => [path, path])).values()];
}

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { body: source, metadata: {} };

  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/);
    if (field) metadata[field[1]] = field[2].replace(/^(?:"(.*)"|'(.*)')$/, "$1$2");
  }
  return { body: source.slice(match[0].length), metadata };
}

function extractTitle(body, fallback) {
  const match = body.match(/^#\s+(.+?)\s*$/m);
  if (!match) return { body, title: fallback };
  return {
    body: `${body.slice(0, match.index)}${body.slice((match.index ?? 0) + match[0].length)}`.replace(/^\s+/, ""),
    title: match[1].trim(),
  };
}

function contentIdentity(sourcePath) {
  const parts = relative(contentRoot, sourcePath).split(sep);
  const language = parts[0];
  if (!["en", "zh"].includes(language)) throw new Error("Medium 临时页只支持中英文内容");

  if (parts[1] === "blog") {
    const fileSlug = basename(sourcePath, extname(sourcePath));
    const parentSlug = basename(dirname(sourcePath));
    const slug = fileSlug === parentSlug ? parentSlug : fileSlug;
    return { language, route: `${language}/blog/${slug}/`, slug };
  }

  if (parts[1] === "books" && parts.length >= 5 && /^chapter_\d+$/.test(parts[3])) {
    const book = parts[2];
    const chapter = parts[3].match(/\d+$/)?.[0];
    const section = basename(sourcePath, extname(sourcePath));
    const chapterRoute = `${language}/books/${book}/chapter-${chapter}/`;
    return {
      language,
      route: section === "overview" ? chapterRoute : `${chapterRoute}${section.replaceAll("_", "-")}/`,
      slug: section === "overview" ? `chapter-${chapter}` : section,
    };
  }

  if (parts[1] === "books" && parts.length === 4 && parts[3] === "overview.md") {
    const book = parts[2];
    return { language, route: `${language}/books/${book}/`, slug: book };
  }

  throw new Error(`不支持生成 Medium 临时页：${relative(projectRoot, sourcePath)}`);
}

export function describeMediumSource(sourcePath, siteUrl = defaultSiteUrl) {
  const identity = contentIdentity(sourcePath);
  const siteRoot = normalizeSiteUrl(siteUrl);
  return {
    ...identity,
    canonical: new URL(identity.route, siteRoot).href,
    importUrl: new URL(`medium-import/${identity.route}`, siteRoot).href,
  };
}

function parseImagePresentation(alt = "") {
  const sizeMatch = alt.match(/\s*\|\s*(\d+(?:\.\d+)?)(%|px)\s*$/i);
  return {
    caption: sizeMatch ? alt.slice(0, sizeMatch.index).trim() : alt.trim(),
    width: sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : undefined,
  };
}

function safeStem(value) {
  return value
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "asset";
}

function shortHash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 10);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function codeSvg(value, language = "text") {
  const maxCharacters = 112;
  const sourceLines = value.replaceAll("\t", "    ").split("\n");
  const rows = [];
  sourceLines.forEach((sourceLine, index) => {
    const chunks = sourceLine.match(new RegExp(`.{1,${maxCharacters}}`, "g")) ?? [""];
    chunks.forEach((chunk, chunkIndex) => rows.push({
      code: chunk,
      number: chunkIndex === 0 ? String(index + 1) : "",
    }));
  });

  const fontSize = 20;
  const lineHeight = 32;
  const codeX = 92;
  const width = Math.max(880, Math.min(1480, codeX + Math.min(maxCharacters, Math.max(...rows.map((row) => row.code.length))) * 12 + 32));
  const headerHeight = 42;
  const height = headerHeight + rows.length * lineHeight + 24;
  const text = rows.map((row, index) => {
    const y = headerHeight + (index + 1) * lineHeight - 8;
    return `<text x="30" y="${y}" fill="#8a94a3" text-anchor="end">${row.number}</text><text x="${codeX}" y="${y}" fill="#273142">${escapeXml(row.code || " ")}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" rx="12" fill="#f7f8fa" stroke="#dfe3e8" stroke-width="2"/>
    <text x="30" y="28" fill="#657184" font-family="Arial, sans-serif" font-size="15">${escapeXml(language || "text")}</text>
    <g font-family="DejaVu Sans Mono, Menlo, Monaco, Consolas, monospace" font-size="${fontSize}" xml:space="preserve">${text}</g>
  </svg>`;
}

async function formulaSvg(tex) {
  mathJaxReady ??= MathJax.init({ loader: { load: ["input/tex", "output/svg"] } });
  const mathJax = await mathJaxReady;
  const node = await mathJax.tex2svgPromise(tex, { display: true });
  const svg = mathJax.startup.adaptor.tags(node, "svg")[0];
  if (!svg) throw new Error(`公式无法渲染：${tex}`);
  return mathJax.startup.adaptor.serializeXML(svg);
}

class AssetManager {
  constructor({ assetBaseUrl, assetDirectory }) {
    this.assetBaseUrl = assetBaseUrl;
    this.assetDirectory = assetDirectory;
    this.records = new Map();
  }

  async initialize() {
    await mkdir(this.assetDirectory, { recursive: true });
  }

  async image(sourcePath) {
    const key = `image:${sourcePath}`;
    if (this.records.has(key)) return this.records.get(key);
    if (!(await exists(sourcePath))) throw new Error(`图片不存在：${sourcePath}`);

    const extension = extname(sourcePath).toLowerCase();
    const fileName = `${safeStem(basename(sourcePath, extension))}-${shortHash(`${mediumAssetVersion}:${relative(projectRoot, sourcePath)}`)}.png`;
    const outputPath = join(this.assetDirectory, fileName);
    await sharp(sourcePath)
      .resize({ width: 1400, withoutEnlargement: true })
      .png({ colours: 256, compressionLevel: 9, dither: 0.8, effort: 10, palette: true, quality: 90 })
      .toFile(outputPath);
    const record = { fileName, url: new URL(fileName, this.assetBaseUrl).href };
    this.records.set(key, record);
    return record;
  }

  async formula(tex) {
    const key = `formula:${tex}`;
    if (this.records.has(key)) return this.records.get(key);

    const fileName = `formula-${shortHash(`${mediumAssetVersion}:${key}`)}.png`;
    const outputPath = join(this.assetDirectory, fileName);
    const svg = await formulaSvg(tex);
    const rendered = await sharp(Buffer.from(svg), { density: 120 })
      .flatten({ background: "#ffffff" })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const { width = 0 } = await sharp(rendered).metadata();
    const horizontalSpace = Math.max(24, mediumFormulaCanvasWidth - width);
    const padded = await sharp(rendered)
      .extend({
        background: { alpha: 1, b: 255, g: 255, r: 255 },
        bottom: 8,
        left: Math.floor(horizontalSpace / 2),
        right: Math.ceil(horizontalSpace / 2),
        top: 8,
      })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
    const record = { fileName, url: new URL(fileName, this.assetBaseUrl).href, size: padded.size };
    this.records.set(key, record);
    return record;
  }

  async code(value, language) {
    const key = `code:${language ?? "text"}:${value}`;
    if (this.records.has(key)) return this.records.get(key);

    const fileName = `code-${safeStem(language ?? "text")}-${shortHash(`${mediumAssetVersion}:${key}`)}.png`;
    const outputPath = join(this.assetDirectory, fileName);
    await sharp(Buffer.from(codeSvg(value, language))).png({ compressionLevel: 9 }).toFile(outputPath);
    const record = { fileName, url: new URL(fileName, this.assetBaseUrl).href };
    this.records.set(key, record);
    return record;
  }
}

function localImage(url) {
  return Boolean(url) && !url.startsWith("/") && !url.startsWith("#") && !/^[A-Za-z][A-Za-z\d+.-]*:/.test(url);
}

function plainInlineFormula(value) {
  const greek = new Map([
    ["alpha", "α"], ["beta", "β"], ["gamma", "γ"], ["delta", "δ"],
    ["epsilon", "ε"], ["lambda", "λ"], ["mu", "μ"], ["sigma", "σ"],
    ["theta", "θ"], ["phi", "φ"], ["pi", "π"], ["rho", "ρ"],
  ]);
  return value
    .replace(/\\([A-Za-z]+)/g, (match, name) => greek.get(name) ?? match)
    .replace(/_\{([^{}]+)}/g, "_$1")
    .replace(/\^\{([^{}]+)}/g, "^$1")
    .trim();
}

function absoluteContentUrl(url, { canonical, language, siteRoot }) {
  if (!url || url.startsWith("#") || url.startsWith("mailto:") || url.startsWith("data:")) return url;
  if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(url)) return url;
  if (url.startsWith("/")) {
    const localized = /^\/(?:books|blog)(?:\/|$)/.test(url) ? `/${language}${url}` : url;
    return new URL(localized.replace(/^\//, ""), siteRoot).href;
  }
  return new URL(url, canonical).href;
}

function mediumAssetPlugin(options) {
  return async (tree) => {
    const images = [];
    const formulas = [];
    const codeBlocks = [];
    visit(tree, "image", (node) => images.push(node));
    visit(tree, "code", (node, index, parent) => {
      if (parent && typeof index === "number") codeBlocks.push({ index, node, parent });
    });
    visit(tree, (node, index, parent) => {
      if ((node.type === "math" || node.type === "inlineMath") && parent && typeof index === "number") {
        formulas.push({ index, node, parent });
      }
    });

    for (const node of images) {
      const rawUrl = node.url?.split(/[?#]/, 1)[0];
      const { caption, width } = parseImagePresentation(node.alt ?? "");
      node.alt = caption;
      node.data ??= {};
      node.data.hProperties = {
        ...node.data.hProperties,
        ...(caption ? { dataMediumCaption: caption } : {}),
        ...(width ? { dataMediumWidth: width } : {}),
        ...(width ? { style: `width:${width};max-width:100%;height:auto` } : {}),
      };
      if (localImage(rawUrl)) {
        const sourcePath = resolve(dirname(options.sourcePath), decodeURIComponent(rawUrl));
        if (!isWithin(projectRoot, sourcePath)) throw new Error(`拒绝读取项目外图片：${node.url}`);
        node.url = (await options.assets.image(sourcePath)).url;
      } else {
        node.url = absoluteContentUrl(node.url, options);
      }
    }

    for (const { index, node, parent } of formulas) {
      if (node.type === "inlineMath") {
        parent.children[index] = { type: "inlineCode", value: plainInlineFormula(node.value) };
        continue;
      }
      parent.children[index] = {
        alt: `Formula: ${node.value.replace(/\s+/g, " ").trim()}`,
        data: { hProperties: { className: ["medium-display-formula"], dataMediumFormula: "display" } },
        title: undefined,
        type: "image",
        url: (await options.assets.formula(node.value)).url,
      };
    }

    for (const { index, node, parent } of codeBlocks) {
      parent.children[index] = {
        alt: `${node.lang || "Code"} listing`,
        data: { hProperties: { className: ["medium-code-image"], style: "width:100%;max-width:100%;height:auto" } },
        title: undefined,
        type: "image",
        url: (await options.assets.code(node.value, node.lang)).url,
      };
    }

    visit(tree, "link", (node) => {
      node.url = absoluteContentUrl(node.url, options);
    });
  };
}

function classes(node) {
  const value = node.properties?.className;
  return Array.isArray(value) ? value : typeof value === "string" ? value.split(/\s+/) : [];
}

function mediumImageCompatibilityPlugin() {
  return (tree) => {
    function imageParagraph(image) {
      const formula = classes(image).includes("medium-display-formula");
      return {
        children: [image],
        properties: { className: [formula ? "medium-formula" : "medium-image"] },
        tagName: "p",
        type: "element",
      };
    }

    function captionParagraph(caption) {
      return {
        children: [{ children: [{ type: "text", value: caption }], properties: {}, tagName: "em", type: "element" }],
        properties: { className: ["medium-image-caption"] },
        tagName: "p",
        type: "element",
      };
    }

    function rewrite(parent) {
      if (!Array.isArray(parent.children)) return;
      const children = [];
      for (const child of parent.children) {
        if (isElement(child, "p") && child.children?.length === 1 && isElement(child.children[0], "img")) {
          const image = child.children[0];
          children.push(imageParagraph(image));
          const caption = image.properties?.dataMediumCaption;
          if (typeof caption === "string" && caption && !classes(image).includes("medium-display-formula")) {
            children.push(captionParagraph(caption));
          }
          continue;
        }
        if (isElement(child, "img")) {
          children.push(imageParagraph(child));
          continue;
        }
        rewrite(child);
        children.push(child);
      }
      parent.children = children;
    }

    rewrite(tree);
  };
}

function isElement(node, tagName) {
  return node?.type === "element" && node.tagName === tagName;
}

function mediumListCompatibilityPlugin() {
  function listParagraphs(list, depth = 0) {
    const ordered = list.tagName === "ol";
    const start = Number(list.properties?.start ?? 1);
    const items = (list.children ?? []).filter((child) => isElement(child, "li"));
    return items.flatMap((item, index) => {
      const inline = [];
      const nested = [];
      for (const child of item.children ?? []) {
        if (isElement(child, "p")) inline.push(...(child.children ?? []));
        else if (isElement(child, "ol") || isElement(child, "ul")) nested.push(child);
        else inline.push(child);
      }
      while (inline[0]?.type === "text" && !inline[0].value.trim()) inline.shift();
      while (inline.at(-1)?.type === "text" && !inline.at(-1).value.trim()) inline.pop();
      const prefix = `${" ".repeat(depth)}${ordered ? `${start + index}.` : "•"} `;
      const paragraph = {
        children: [{ type: "text", value: prefix }, ...inline],
        properties: { className: ["medium-list-line"] },
        tagName: "p",
        type: "element",
      };
      return [paragraph, ...nested.flatMap((child) => listParagraphs(child, depth + 1))];
    });
  }

  return (tree) => {
    function rewrite(parent) {
      if (!Array.isArray(parent.children)) return;
      const children = [];
      for (const child of parent.children) {
        if (isElement(child, "ol") || isElement(child, "ul")) {
          children.push(...listParagraphs(child));
          continue;
        }
        rewrite(child);
        children.push(child);
      }
      parent.children = children;
    }
    rewrite(tree);
  };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlDocument({ body, canonical, language, summary, title }) {
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-CN" : "en"}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(summary ?? "")}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <style>
    body { margin: 0; background: #fff; color: #242424; font: 20px/1.58 Georgia, "Times New Roman", serif; }
    article { box-sizing: border-box; max-width: 760px; margin: 0 auto; padding: 56px 24px 96px; }
    h1, h2, h3, h4 { color: #202124; font-family: Arial, Helvetica, sans-serif; line-height: 1.18; }
    h1 { margin: 0 0 16px; font-size: 42px; } h2 { margin: 48px 0 16px; font-size: 30px; }
    h3 { margin: 36px 0 14px; font-size: 24px; } h4 { margin: 30px 0 12px; font-size: 20px; }
    p { margin: 0 0 24px; } li { margin-bottom: 8px; } a { color: #1967d2; }
    blockquote { margin: 28px 0; padding-left: 20px; border-left: 3px solid #c8c8c8; color: #555; }
    pre { overflow-x: auto; margin: 28px 0; padding: 20px; border-radius: 6px; background: #f5f6f7; font: 14px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    code { font: .88em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .medium-image, .medium-formula { margin: 24px auto 8px; text-align: center; }
    .medium-image img, .medium-formula img { display: block; max-width: 100%; height: auto; margin: 0 auto; }
    .medium-image-caption { margin: 0 0 20px; color: #777; text-align: center; font: 14px/1.4 Arial, Helvetica, sans-serif; }
    .medium-list-line { margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; font: 15px/1.45 Arial, Helvetica, sans-serif; }
    th, td { padding: 8px 10px; border: 1px solid #ddd; text-align: left; }
  </style>
</head>
<body>
  <article>
${body}
  </article>
</body>
</html>
`;
}

async function renderArticle(source, options) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(mediumAssetPlugin, options)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      footnoteBackLabel: options.language === "zh" ? "返回正文" : "Back to content",
      footnoteLabel: options.language === "zh" ? "注释" : "Footnotes",
    })
    .use(mediumListCompatibilityPlugin)
    .use(mediumImageCompatibilityPlugin)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(source);
  return String(result);
}

export async function generateMediumImport({ input, outputRoot = defaultOutputRoot, siteUrl = defaultSiteUrl }) {
  const sourcePath = await resolveMediumSource(input);
  const identity = describeMediumSource(sourcePath, siteUrl);
  const siteRoot = normalizeSiteUrl(siteUrl);
  const { canonical, importUrl } = identity;
  const outputDirectory = join(outputRoot, "medium-import", ...identity.route.split("/").filter(Boolean));
  const assetDirectory = join(outputDirectory, "assets");
  const assets = new AssetManager({ assetBaseUrl: new URL("assets/", importUrl), assetDirectory });
  await assets.initialize();

  const raw = await readFile(sourcePath, "utf8");
  const { body: frontmatterBody, metadata } = parseFrontmatter(raw);
  const { body, title } = extractTitle(frontmatterBody, identity.slug);
  const note = identity.language === "zh"
    ? `> 本文首发于[小胖笔记](${canonical})。`
    : `> Originally published on [Xiaopang Notes](${canonical}).`;
  const source = `# ${title}\n\n${metadata.summary ? `*${metadata.summary}*\n\n` : ""}${note}\n\n${body.trim()}\n`;
  const rendered = await renderArticle(source, {
    assets,
    canonical,
    language: identity.language,
    siteRoot,
    sourcePath,
  });
  await writeFile(join(outputDirectory, "index.html"), htmlDocument({
    body: rendered,
    canonical,
    language: identity.language,
    summary: metadata.summary,
    title,
  }));

  return { canonical, importUrl, outputDirectory, sourcePath, title };
}

export async function generateConfiguredMediumImport({
  configPath = defaultConfigPath,
  outputRoot = defaultOutputRoot,
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || defaultSiteUrl,
} = {}) {
  await rm(join(outputRoot, "medium-import"), { force: true, recursive: true });
  if (!(await exists(configPath))) return null;

  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("medium-import.json 必须是单个对象");
  if (!Array.isArray(config.sources) || config.sources.length === 0) throw new Error("medium-import.json 缺少 sources");

  const sources = await resolveMediumSources(config.sources);
  const results = [];
  for (const source of sources) results.push(await generateMediumImport({ input: source, outputRoot, siteUrl }));
  return results;
}
