import assert from "node:assert/strict";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import sharp from "sharp";
import {
  generateConfiguredMediumImport,
  generateMediumImport,
  resolveMediumSources,
} from "../scripts/medium-import.mjs";

const siteUrl = "https://gentang.github.io/";

test("resolves one page, several pages, a chapter directory, and all content", async () => {
  const pages = await resolveMediumSources([
    "/en/blog/watermarking_on_aigc/",
    "/en/books/deconstructing_LLM/chapter-3/3-2/",
  ]);
  assert.equal(pages.length, 2);
  assert.match(pages[0], /content\/en\/blog\/watermarking_on_aigc\/watermarking_on_aigc\.md$/);
  assert.match(pages[1], /content\/en\/books\/deconstructing_LLM\/chapter_3\/3_2\.md$/);

  const chapter = await resolveMediumSources(["content/en/books/deconstructing_LLM/chapter_3"]);
  assert.equal(chapter.length, 6);
  assert.ok(chapter.every((path) => path.includes("/chapter_3/")));

  const all = await resolveMediumSources([], { all: true });
  assert.ok(all.length > chapter.length);
  assert.ok(all.some((path) => path.endsWith("/content/en/books/deconstructing_LLM/overview.md")));
  assert.ok(all.some((path) => path.endsWith("/content/zh/blog/watermarking_on_aigc/watermarking_on_aigc.md")));
});

test("generates several configured pages and removes the temporary tree when configuration is absent", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "xiaopang-medium-configured-"));
  const configPath = join(outputRoot, "medium-import.json");
  await writeFile(configPath, JSON.stringify({
    importVersion: "20260820153000123",
    sources: [
      "content/en/blog/watermarking_on_aigc/watermarking_on_aigc.md",
      "content/en/blog/watermarking_on_aigc_2/watermarking_on_aigc_2.md",
    ],
  }));

  const results = await generateConfiguredMediumImport({ configPath, outputRoot, siteUrl });
  assert.equal(results.length, 2);
  const version = results[0].importVersion;
  assert.equal(version, "20260820153000123");
  assert.ok(results.every((result) => result.importVersion === version));
  await access(join(outputRoot, `medium-import/${version}/en/blog/watermarking_on_aigc/index.html`));
  await access(join(outputRoot, `medium-import/${version}/en/blog/watermarking_on_aigc_2/index.html`));
  const manifest = JSON.parse(await readFile(join(outputRoot, "medium-import/manifest.json"), "utf8"));
  assert.equal(manifest.importVersion, version);
  assert.equal(manifest.pages.length, 2);

  const missingConfig = join(outputRoot, "removed-medium-import.json");
  assert.equal(await generateConfiguredMediumImport({ configPath: missingConfig, outputRoot, siteUrl }), null);
  await assert.rejects(access(join(outputRoot, "medium-import")), { code: "ENOENT" });
});

test("generates a Medium import page with public PNG assets and compatible lists", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "xiaopang-medium-import-"));
  const result = await generateMediumImport({
    importVersion: "20260820153000123",
    input: "/en/blog/watermarking_on_aigc/",
    outputRoot,
    siteUrl,
  });

  assert.equal(result.canonical, "https://gentang.github.io/en/blog/watermarking_on_aigc/");
  assert.equal(result.importUrl, "https://gentang.github.io/medium-import/20260820153000123/en/blog/watermarking_on_aigc/");

  const htmlPath = join(outputRoot, "medium-import/20260820153000123/en/blog/watermarking_on_aigc/index.html");
  const html = await readFile(htmlPath, "utf8");
  assert.match(html, /<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.doesNotMatch(html, /<link rel="canonical"/);
  assert.doesNotMatch(html, /\.webp(?:["?#])/);
  assert.doesNotMatch(html, /data:image/);
  assert.doesNotMatch(html, /\$\$/);
  assert.doesNotMatch(html, /<(?:ol|ul|li|blockquote)(?:\s|>)/);
  assert.doesNotMatch(html, /<p>\s*<\/p>/);
  assert.match(html, /<p><em>Originally published[^]*?<\/em><\/p><h2>Key Takeaways \/ TL;DR<\/h2>/);
  assert.match(html, /<h2>How KGW Works<\/h2>/);
  assert.match(html, /<h4>Algorithm and Implementation<\/h4>/);
  assert.match(html, /<h4>Detection<\/h4>/);
  assert.doesNotMatch(html, /<h3>/);
  assert.match(html, /<pre><code class="language-python">[^]*<br>/);
  assert.match(html, /<p class="medium-listing-title"><strong>Listing 1 \(<a href="[^"]+">Complete Notebook<\/a>\)<\/strong><\/p>/);
  assert.doesNotMatch(html, /<h4>Listing 1/);
  assert.match(html, /<code>Z_score<\/code>/);
  assert.match(html, /<p class="medium-formula"><img[^>]+formula-[a-f0-9]+\.png/);
  assert.doesNotMatch(html, /code-python-[a-f0-9]+\.png/);
  assert.match(html, /<br>\u00a0{4}def greenlist/);
  assert.match(html, /<br>\u00a0{8}"""Deterministically/);
  assert.match(html, /<br>\u00a0{12}previous_token =/);

  const imageUrls = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(imageUrls.length, 7);
  assert.ok(imageUrls.every((url) => url.startsWith(`${result.importUrl}assets/`) && url.endsWith(".png")));
  for (const url of imageUrls) {
    const relativeAsset = new URL(url).pathname.replace(/^\/medium-import\//, "medium-import/");
    await access(join(outputRoot, relativeAsset));
  }

  const formulaUrl = imageUrls.find((url) => url.includes("/formula-"));
  const formulaPath = join(outputRoot, new URL(formulaUrl).pathname.replace(/^\/medium-import\//, "medium-import/"));
  const formulaMetadata = await sharp(formulaPath).metadata();
  assert.equal(formulaMetadata.width, 760);
  assert.ok(formulaMetadata.height < 100);
  assert.equal(formulaMetadata.hasAlpha, false);
  const formulaStats = await sharp(formulaPath).stats();
  assert.ok(formulaStats.channels[0].max > 245);
  assert.ok(formulaStats.channels[0].min < 20);
  const trimmedFormula = await sharp(formulaPath)
    .trim({ background: "#ffffff" })
    .toBuffer({ resolveWithObject: true });
  assert.ok(trimmedFormula.info.width < 300);

  const attacks = html.slice(html.indexOf("<h2>Attacks and Evasion</h2>"), html.indexOf("<h2>Conclusion</h2>"));
  assert.doesNotMatch(attacks, /<(?:ol|ul|li)(?:\s|>)/);
  assert.match(attacks, /2\. <strong>Rewrite or back-translate the text:<\/strong>/);
  assert.match(attacks, /• <strong>Model paraphrasing:<\/strong>/);
});

test("converts tables and footnotes into structures that Medium preserves", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "xiaopang-medium-tables-"));
  const result = await generateMediumImport({
    importVersion: "20260821093000123",
    input: "/en/blog/watermarking_on_aigc_2/",
    outputRoot,
    siteUrl,
  });
  const htmlPath = join(outputRoot, "medium-import/20260821093000123/en/blog/watermarking_on_aigc_2/index.html");
  const html = await readFile(htmlPath, "utf8");

  assert.doesNotMatch(html, /<(?:table|thead|tbody|tr|th|td)(?:\s|>)/);
  assert.doesNotMatch(html, /<(?:section|sup)(?:\s|>)/);
  assert.doesNotMatch(html, /data-footnote-(?:ref|backref)/);
  assert.match(html, /<img[^>]+table-[a-f0-9]+\.png[^>]+class="medium-table-image"/);
  assert.match(html, /<strong class="medium-footnote-ref">\[1\]<\/strong>/);
  assert.match(html, /<h2>Footnotes<\/h2>/);
  assert.match(html, /1\. To make the first case/);
  assert.match(html, /2\. The algorithm does not permanently favor/);

  const tableUrls = [...html.matchAll(/<img[^>]+src="([^"]+table-[^"]+\.png)"/g)].map((match) => match[1]);
  assert.equal(tableUrls.length, 2);
  for (const url of tableUrls) {
    assert.ok(url.startsWith(`${result.importUrl}assets/`));
    const relativeAsset = new URL(url).pathname.replace(/^\/medium-import\//, "medium-import/");
    const tablePath = join(outputRoot, relativeAsset);
    await access(tablePath);
    const metadata = await sharp(tablePath).metadata();
    assert.ok((metadata.width ?? 0) >= 1400);
    assert.ok((metadata.height ?? 0) > 150);
  }
});
