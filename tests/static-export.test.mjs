import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import test from "node:test";

const outputRoot = resolve("out");
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function exportedPage(route) {
  if (route === "/") return join(outputRoot, "index.html");
  return join(outputRoot, route.replace(/^\//, ""), "index.html");
}

async function html(route) {
  return readFile(exportedPage(route), "utf8");
}

test("exports the homepage with local assets and the intended section order", async () => {
  const source = await html("/");
  assert.match(source, /小胖笔记/);
  assert.match(source, /万一我证明了<em>黎曼猜想<\/em>/);
  assert.match(source, /阅读最新博客/);
  assert.match(source, /解构大语言模型/);
  assert.match(source, /第一篇文章正在写作中，敬请期待/);
  assert.ok(source.indexOf("01 / BLOG") < source.indexOf("02 / BOOK"));
  assert.match(source, new RegExp(`src="${basePath}/images/deconstructing-llm-cover\\.png"`));
  assert.doesNotMatch(source, /MVP|AI · BOOKS · NOTES|第一本书，从这里开始/);
});

test("exports every current reading route", async () => {
  const routes = [
    ["/books/deconstructing_LLM/chapter-1", /绪论/],
    ["/books/deconstructing_LLM/chapter-1/1-1", /1.1 是数字鹦鹉，还是自我意识/],
    ["/books/deconstructing_LLM/chapter-1/1-2", /1.2 数据基础/],
    ["/books/deconstructing_LLM/chapter-1/1-3", /1.3 模型结构/],
    ["/books/deconstructing_LLM/chapter-1/1-4", /1.4 关于本书/],
    ["/books/deconstructing_LLM/chapter-2", /数学基础——不可或缺的知识/],
    ["/books/deconstructing_LLM/chapter-2/2-1", /2.1 向量、矩阵和张量/],
    ["/books/deconstructing_LLM/chapter-2/2-2", /2.2 概率/],
    ["/books/deconstructing_LLM/chapter-2/2-3", /2.3 微积分/],
    ["/books/deconstructing_LLM/chapter-2/2-4", /2.4 本章小结/],
    ["/en/books/deconstructing_LLM/chapter-1", /Begin with the question/],
    ["/blog/ai-as-collaborator", /第一篇文章正在写作中，敬请期待/],
    ["/en/blog/ai-as-collaborator", /From tool to collaborator/],
  ];

  for (const [route, expected] of routes) {
    assert.match(await html(route), expected, route);
  }
});

test("derives the two-level book navigation from content files", async () => {
  const source = await html("/books/deconstructing_LLM/chapter-1");
  assert.doesNotMatch(source, />概览</);
  assert.match(source, /第一章：绪论/);
  assert.match(source, /第二章：数学基础——不可或缺的知识/);
  assert.match(source, /第 3 章/);
  assert.match(source, new RegExp(`href="${basePath}/books/deconstructing_LLM/chapter-1/1-4/"`));
  assert.match(source, /下一节.*1\.1 是数字鹦鹉，还是自我意识/s);
});

test("exports formulas, footnotes, chapter images, and their anchors", async () => {
  const overview = await html("/books/deconstructing_LLM/chapter-1");
  assert.match(overview, /id="user-content-fnref-1"[^>]*data-footnote-ref="true"/);
  assert.match(overview, /href="#user-content-fnref-1"[^>]*data-footnote-backref/);

  const vectors = await html("/books/deconstructing_LLM/chapter-2/2-1");
  assert.match(vectors, /id="eq-2-1"/);
  assert.match(vectors, /href="#eq-2-1">公式（2-1）<\/a>/);
  assert.match(vectors, /id="section-2-1-3"/);

  const chapterOne = await html("/books/deconstructing_LLM/chapter-1/1-1");
  assert.match(chapterOne, new RegExp(`src="${basePath}/generated/book-images/chapter_1/1-1\\.png"`));
  assert.match(chapterOne, /<figcaption>[^<]+<\/figcaption>/);
  await access(join(outputRoot, "generated", "book-images", "chapter_1", "1-1.png"));
  await access(join(outputRoot, "generated", "book-images", "chapter_2", "2-15.png"));
  await access(join(outputRoot, ".nojekyll"));
});
