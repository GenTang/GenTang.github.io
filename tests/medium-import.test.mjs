import assert from "node:assert/strict";
import { access, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
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
    sources: [
      "content/en/blog/watermarking_on_aigc/watermarking_on_aigc.md",
      "content/en/blog/watermarking_on_aigc_2/watermarking_on_aigc_2.md",
    ],
  }));

  const results = await generateConfiguredMediumImport({ configPath, outputRoot, siteUrl });
  assert.equal(results.length, 2);
  await access(join(outputRoot, "medium-import/en/blog/watermarking_on_aigc/index.html"));
  await access(join(outputRoot, "medium-import/en/blog/watermarking_on_aigc_2/index.html"));

  const missingConfig = join(outputRoot, "removed-medium-import.json");
  assert.equal(await generateConfiguredMediumImport({ configPath: missingConfig, outputRoot, siteUrl }), null);
  await assert.rejects(access(join(outputRoot, "medium-import")), { code: "ENOENT" });
});

test("generates a Medium import page with public PNG assets and compatible lists", async () => {
  const outputRoot = await mkdtemp(join(tmpdir(), "xiaopang-medium-import-"));
  const result = await generateMediumImport({
    input: "/en/blog/watermarking_on_aigc/",
    outputRoot,
    siteUrl,
  });

  assert.equal(result.canonical, "https://gentang.github.io/en/blog/watermarking_on_aigc/");
  assert.equal(result.importUrl, "https://gentang.github.io/medium-import/en/blog/watermarking_on_aigc/");

  const htmlPath = join(outputRoot, "medium-import/en/blog/watermarking_on_aigc/index.html");
  const html = await readFile(htmlPath, "utf8");
  assert.match(html, /<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/gentang\.github\.io\/en\/blog\/watermarking_on_aigc\/">/);
  assert.doesNotMatch(html, /\.webp(?:["?#])/);
  assert.doesNotMatch(html, /data:image/);
  assert.doesNotMatch(html, /\$\$/);
  assert.doesNotMatch(html, /<li>\s*<p>/);
  assert.match(html, /<code>Z_score<\/code>/);
  assert.match(html, /<figure class="medium-formula"><img[^>]+formula-[a-f0-9]+\.png/);

  const imageUrls = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(imageUrls.length, 7);
  assert.ok(imageUrls.every((url) => url.startsWith(`${result.importUrl}assets/`) && url.endsWith(".png")));
  for (const url of imageUrls) {
    const relativeAsset = new URL(url).pathname.replace(/^\/medium-import\//, "medium-import/");
    await access(join(outputRoot, relativeAsset));
  }

  const attacks = html.slice(html.indexOf("<h2>Attacks and Evasion</h2>"), html.indexOf("<h2>Conclusion</h2>"));
  assert.equal((attacks.match(/<li>/g) ?? []).length, 2);
  assert.doesNotMatch(attacks, /<ul>/);
  assert.match(attacks, /<br>• <strong>Model paraphrasing:<\/strong>/);
});
