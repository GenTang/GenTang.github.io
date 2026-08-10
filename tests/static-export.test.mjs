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
  const source = await html("/");
  assert.match(source, /小胖笔记/);
  assert.match(source, /万一我证明了<em>黎曼猜想<\/em>/);
  assert.match(source, /阅读最新章节/);
  assert.match(source, /解构大语言模型/);
  assert.match(source, /已发布<\/span><strong>12 章<\/strong>/);
  assert.match(source, /第一篇文章正在写作中，敬请期待/);
  assert.match(source, /持续更新/);
  assert.doesNotMatch(source, /NOTE \/ 001/);
  assert.match(source, new RegExp(`href="${basePath}/books/deconstructing_LLM/"`));
  assert.match(source, new RegExp(`href="${basePath}/books/deconstructing_LLM/chapter-12/12-6/"`));
  assert.ok(source.indexOf(">BLOG<") < source.indexOf(">BOOK<"));
  assert.doesNotMatch(source, /01 \/ BLOG|02 \/ BOOK|全书按章节持续更新，目前已发布绪论与数学基础两章/);
  assert.match(source, new RegExp(`src="${basePath}/images/deconstructing-llm-cover\\.png"`));
  assert.doesNotMatch(source, /MVP|AI · BOOKS · NOTES|第一本书，从这里开始/);
});

test("exports crawl controls, sitemap, feeds, canonical metadata, and correct page languages", async () => {
  const [robots, sitemap, rss, atom, home, latest, draftBlog, english] = await Promise.all([
    readFile(join(outputRoot, "robots.txt"), "utf8"),
    readFile(join(outputRoot, "sitemap.xml"), "utf8"),
    readFile(join(outputRoot, "rss.xml"), "utf8"),
    readFile(join(outputRoot, "atom.xml"), "utf8"),
    html("/"),
    html("/books/deconstructing_LLM/chapter-12/12-6"),
    html("/blog/ai-as-collaborator"),
    html("/en/"),
  ]);

  assert.match(robots, /User-agent: \*\nAllow: \//);
  assert.match(robots, /User-agent: OAI-SearchBot\nAllow: \//);
  assert.match(robots, /User-agent: GPTBot\nDisallow: \//);
  assert.match(robots, /User-agent: Google-Extended\nDisallow: \//);
  assert.match(robots, new RegExp(`Sitemap: ${publicUrl("/sitemap.xml").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

  assert.ok(sitemap.includes(`<loc>${publicUrl("/")}</loc>`));
  assert.ok(sitemap.includes(`<loc>${publicUrl("/books/deconstructing_LLM/chapter-12/12-6")}</loc>`));
  assert.ok(!sitemap.includes("blog/ai-as-collaborator"));
  assert.ok(rss.includes(`<link>${publicUrl("/books/deconstructing_LLM/chapter-12/12-6")}</link>`));
  assert.match(rss, /12\.6 本章小结/);
  assert.ok(atom.includes(`<id>${publicUrl("/books/deconstructing_LLM/chapter-12/12-6")}</id>`));

  assert.ok(home.includes(`rel="canonical" href="${publicUrl("/")}"`));
  assert.ok(home.includes(`type="application/rss+xml"`));
  assert.ok(latest.includes(`rel="canonical" href="${publicUrl("/books/deconstructing_LLM/chapter-12/12-6")}"`));
  assert.match(latest, /property="og:title" content="12\.6 本章小结"/);
  assert.match(draftBlog, /name="robots" content="noindex, follow"/);
  assert.match(english, /<html lang="en"/);
  assert.match(home, /© 2026 唐亘 · 小胖笔记/);
  assert.match(home, new RegExp(`href="${basePath}/rss\\.xml"`));
});

test("exports every current reading route", async () => {
  const routes = [
    ["/books/deconstructing_LLM", /READING MAP/],
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
    ["/books/deconstructing_LLM/chapter-3", /第三章：线性回归——模型之母/],
    ["/books/deconstructing_LLM/chapter-3/3-1", /3.1 一个简单的例子/],
    ["/books/deconstructing_LLM/chapter-3/3-2", /3.2 模型实现/],
    ["/books/deconstructing_LLM/chapter-3/3-3", /3.3 模型陷阱/],
    ["/books/deconstructing_LLM/chapter-3/3-4", /3.4 面向未来的准备/],
    ["/books/deconstructing_LLM/chapter-3/3-5", /3.5 本章小结/],
    ["/books/deconstructing_LLM/chapter-4", /第四章：逻辑回归——隐藏因子/],
    ["/books/deconstructing_LLM/chapter-4/4-1", /4.1 二元分类问题：是与否/],
    ["/books/deconstructing_LLM/chapter-4/4-2", /4.2 模型实现/],
    ["/books/deconstructing_LLM/chapter-4/4-3", /4.3 评估模型效果/],
    ["/books/deconstructing_LLM/chapter-4/4-4", /4.4 非均衡数据集/],
    ["/books/deconstructing_LLM/chapter-4/4-5", /4.5 多元分类问题：超越是与否/],
    ["/books/deconstructing_LLM/chapter-4/4-6", /4.6 本章小结/],
    ["/books/deconstructing_LLM/chapter-5", /第五章：计量经济学的启示——他山之石/],
    ["/books/deconstructing_LLM/chapter-5/5-1", /5.1 定量与定性：特征的数学运算合理吗/],
    ["/books/deconstructing_LLM/chapter-5/5-2", /5.2 定性特征的处理/],
    ["/books/deconstructing_LLM/chapter-5/5-3", /5.3 定量特征的处理/],
    ["/books/deconstructing_LLM/chapter-5/5-4", /5.4 多重共线性：多变量的烦恼/],
    ["/books/deconstructing_LLM/chapter-5/5-5", /5.5 本章小结/],
    ["/books/deconstructing_LLM/chapter-6", /第六章：最优化算法——参数估计/],
    ["/books/deconstructing_LLM/chapter-6/6-1", /6.1 算法思路：模拟滚动/],
    ["/books/deconstructing_LLM/chapter-6/6-2", /6.2 梯度下降法/],
    ["/books/deconstructing_LLM/chapter-6/6-3", /6.3 梯度下降法的代码实现/],
    ["/books/deconstructing_LLM/chapter-6/6-4", /6.4 随机梯度下降法：更优化的算法/],
    ["/books/deconstructing_LLM/chapter-6/6-5", /6.5 本章小结/],
    ["/books/deconstructing_LLM/chapter-7", /第七章：反向传播——神经网络的工程基础/],
    ["/books/deconstructing_LLM/chapter-7/7-1", /7.1 计算图和向前传播/],
    ["/books/deconstructing_LLM/chapter-7/7-2", /7.2 链式法则和反向传播/],
    ["/books/deconstructing_LLM/chapter-7/7-3", /7.3 参数估计的全流程/],
    ["/books/deconstructing_LLM/chapter-7/7-4", /7.4 动态优化/],
    ["/books/deconstructing_LLM/chapter-7/7-5", /7.5 真实世界：针对大规模模型的优化技巧/],
    ["/books/deconstructing_LLM/chapter-7/7-6", /7.6 本章小结/],
    ["/books/deconstructing_LLM/chapter-8", /第八章：多层感知器——神经网络的“创世记”/],
    ["/books/deconstructing_LLM/chapter-8/8-1", /8.1 感知器模型/],
    ["/books/deconstructing_LLM/chapter-8/8-2", /8.2 从神经网络的视角重新理解逻辑回归/],
    ["/books/deconstructing_LLM/chapter-8/8-3", /8.3 多层感知器/],
    ["/books/deconstructing_LLM/chapter-8/8-4", /8.4 训练优化的关键：激活函数/],
    ["/books/deconstructing_LLM/chapter-8/8-5", /8.5 从第一步开始优化训练/],
    ["/books/deconstructing_LLM/chapter-8/8-6", /8.6 本章小结/],
    ["/books/deconstructing_LLM/chapter-9", /第九章：卷积神经网络——深度学习的“出埃及记”/],
    ["/books/deconstructing_LLM/chapter-9/9-1", /9.1 利用多层感知器识别数字/],
    ["/books/deconstructing_LLM/chapter-9/9-2", /9.2 卷积神经网络/],
    ["/books/deconstructing_LLM/chapter-9/9-3", /9.3 残差网络/],
    ["/books/deconstructing_LLM/chapter-9/9-4", /9.4 本章小结/],
    ["/books/deconstructing_LLM/chapter-10", /第十章：循环神经网络——尝试理解人类语言/],
    ["/books/deconstructing_LLM/chapter-10/10-1", /10.1 自然语言处理的基本要素/],
    ["/books/deconstructing_LLM/chapter-10/10-2", /10.2 利用多层感知器学习语言/],
    ["/books/deconstructing_LLM/chapter-10/10-3", /10.3 循环神经网络/],
    ["/books/deconstructing_LLM/chapter-10/10-4", /10.4 深度循环神经网络/],
    ["/books/deconstructing_LLM/chapter-10/10-5", /10.5 长短期记忆网络/],
    ["/books/deconstructing_LLM/chapter-10/10-6", /10.6 本章小结/],
    ["/books/deconstructing_LLM/chapter-11", /第十一章：大语言模型——是通用人工智能的开始吗/],
    ["/books/deconstructing_LLM/chapter-11/11-1", /11.1 注意力机制/],
    ["/books/deconstructing_LLM/chapter-11/11-2", /11.2 从零开始实现 GPT-2/],
    ["/books/deconstructing_LLM/chapter-11/11-3", /11.3 从大语言模型到智能助手/],
    ["/books/deconstructing_LLM/chapter-11/11-4", /11.4 模型微调/],
    ["/books/deconstructing_LLM/chapter-11/11-5", /11.5 监督微调和评分建模/],
    ["/books/deconstructing_LLM/chapter-11/11-6", /11.6 超越技术/],
    ["/books/deconstructing_LLM/chapter-11/11-7", /11.7 本章小结/],
    ["/books/deconstructing_LLM/chapter-12", /第十二章：强化学习——在动态交互中进化/],
    ["/books/deconstructing_LLM/chapter-12/12-1", /12.1 大语言模型的持续优化/],
    ["/books/deconstructing_LLM/chapter-12/12-2", /12.2 强化学习简介/],
    ["/books/deconstructing_LLM/chapter-12/12-3", /12.3 值函数学习/],
    ["/books/deconstructing_LLM/chapter-12/12-4", /12.4 策略学习/],
    ["/books/deconstructing_LLM/chapter-12/12-5", /12.5 利用 PPO 优化大语言模型/],
    ["/books/deconstructing_LLM/chapter-12/12-6", /12.6 本章小结/],
    ["/en/books/deconstructing_LLM/chapter-1", /Begin with the question/],
    ["/blog/ai-as-collaborator", /第一篇文章正在写作中，敬请期待/],
    ["/en/blog/ai-as-collaborator", /From tool to collaborator/],
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
  const source = await html("/books/deconstructing_LLM");
  const overviewMarkdown = await readFile(
    resolve("content/zh/books/deconstructing_LLM/overview.md"),
    "utf8",
  );
  const bookConfig = JSON.parse(await readFile(
    resolve("content/zh/books/deconstructing_LLM/book.json"),
    "utf8",
  ));
  assert.ok(overviewMarkdown.trim().length > 0);
  assert.match(source, /在理论基础方面/);
  assert.match(source, /READING MAP/);
  for (const part of bookConfig.parts) assert.ok(source.includes(part.title));
  assert.match(source, /https:\/\/space\.bilibili\.com\/417265639\/lists\/3138772/);
  assert.match(source, /https:\/\/github\.com\/GenTang\/regression2chatgpt/);
  assert.match(source, new RegExp(`src="${basePath}/images/deconstructing-llm-outline\\.png"`));
  assert.doesNotMatch(source, /从基础模型，一直走到智能系统|三个部分构成一条连续的学习路径/);
  assert.doesNotMatch(source, /在线目录|完整图书介绍|已上线|准备中/);
  await access(join(outputRoot, "images", "deconstructing-llm-outline.png"));
});

test("derives the two-level book navigation from content files", async () => {
  const source = await html("/books/deconstructing_LLM/chapter-1");
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
  assert.match(source, new RegExp(`href="${basePath}/books/deconstructing_LLM/chapter-1/1-4/"`));
  assert.match(source, /下一节.*1\.1 是数字鹦鹉，还是自我意识/s);
  assert.match(source, /<details class="toc-chapter is-open"[^>]*open/);
  assert.match(source, /<details class="toc-chapter">/);
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
  const chapterThree = await html("/books/deconstructing_LLM/chapter-3/3-1");
  assert.match(chapterThree, /id="eq-3-1"/);
  assert.match(chapterThree, new RegExp(`src="${basePath}/generated/book-images/chapter_3/3-1[.]png"`));
  assert.match(
    chapterThree,
    new RegExp(`href="${basePath}/books/deconstructing_LLM/chapter-3/3-2/#section-3-2-2"`),
  );
  assert.doesNotMatch(chapterThree, /chapter-2\/3-2/);

  const implementation = await html("/books/deconstructing_LLM/chapter-3/3-2");
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

  const chapterFour = await html("/books/deconstructing_LLM/chapter-4/4-1");
  assert.match(chapterFour, /id="eq-4-1"/);
  assert.match(chapterFour, new RegExp(`src="${basePath}/generated/book-images/chapter_4/4-1[.]png"`));

  const chapterFourImplementation = await html("/books/deconstructing_LLM/chapter-4/4-2");
  assert.match(chapterFourImplementation, /程序清单 4-1/);
  assert.match(chapterFourImplementation, /class="code-line" data-line-number="10"/);
  assert.match(
    chapterFourImplementation,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch04_logit\/logit_regression\.ipynb/,
  );

  for (const section of ["4_1", "4_2", "4_3", "4_4", "4_5", "4_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_4/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterFive = await html("/books/deconstructing_LLM/chapter-5/5-2");
  assert.match(chapterFive, /id="eq-5-1"/);
  assert.match(chapterFive, new RegExp(`src="${basePath}/generated/book-images/chapter_5/5-2[.]png"`));
  assert.match(
    chapterFive,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch05_econometrics\/categorical_variable\.ipynb/,
  );

  const chapterFiveCollinearity = await html("/books/deconstructing_LLM/chapter-5/5-4");
  assert.match(chapterFiveCollinearity, /<p class="table-title">表 5-1<\/p>/);
  assert.match(
    chapterFiveCollinearity,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch05_econometrics\/multicollinearity\.ipynb/,
  );

  for (const section of ["5_1", "5_2", "5_3", "5_4", "5_5"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_5/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }
  const chapterSix = await html("/books/deconstructing_LLM/chapter-6/6-3");
  assert.match(chapterSix, /程序清单 6-1/);
  assert.match(chapterSix, /程序清单 6-5/);
  assert.match(chapterSix, /class="code-line" data-line-number="33"/);
  assert.match(
    chapterSix,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch06_optimizer\/gradient_descent\.ipynb/,
  );

  const chapterSixSgd = await html("/books/deconstructing_LLM/chapter-6/6-4");
  assert.match(chapterSixSgd, /id="eq-6-7"/);
  assert.match(chapterSixSgd, /程序清单 6-6/);
  assert.match(
    chapterSixSgd,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch06_optimizer\/stochastic_gradient_descent\.ipynb/,
  );

  for (const section of ["6_1", "6_2", "6_3", "6_4", "6_5"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_6/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }

  const chapterSevenAutograd = await html("/books/deconstructing_LLM/chapter-7/7-2");
  assert.match(chapterSevenAutograd, /id="eq-7-1"/);
  assert.match(chapterSevenAutograd, /href="#eq-7-1">公式（7-1）<\/a>/);
  assert.match(chapterSevenAutograd, /程序清单 7-3/);
  assert.match(chapterSevenAutograd, /程序清单 7-5/);
  assert.match(chapterSevenAutograd, /class="code-line" data-line-number="41"/);
  assert.match(
    chapterSevenAutograd,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch07_autograd\/utils\.py/,
  );

  const chapterSevenGpu = await html("/books/deconstructing_LLM/chapter-7/7-5");
  assert.match(chapterSevenGpu, /程序清单 7-9/);
  assert.match(chapterSevenGpu, /class="code-line" data-line-number="16"/);
  assert.match(
    chapterSevenGpu,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch07_autograd\/gpu\.ipynb/,
  );

  for (const section of ["7_1", "7_2", "7_3", "7_4", "7_5", "7_6"]) {
    const markdown = await readFile(
      resolve(`content/zh/books/deconstructing_LLM/chapter_7/${section}.md`),
      "utf8",
    );
    assert.doesNotMatch(markdown, /\$\$\s*[，；。]/, section);
  }

  const chapterEightPerceptron = await html("/books/deconstructing_LLM/chapter-8/8-1");
  assert.match(chapterEightPerceptron, /id="eq-8-1"/);
  assert.match(chapterEightPerceptron, /id="eq-8-10"/);
  assert.match(chapterEightPerceptron, /href="#eq-8-8">公式（8-8）<\/a>/);
  assert.match(
    chapterEightPerceptron,
    new RegExp(`src="${basePath}/generated/book-images/chapter_8/8-1[.]png"`),
  );

  const chapterEightLogit = await html("/books/deconstructing_LLM/chapter-8/8-2");
  assert.match(chapterEightLogit, /程序清单 8-1/);
  assert.match(chapterEightLogit, /程序清单 8-2/);
  assert.match(chapterEightLogit, /class="code-line" data-line-number="57"/);
  assert.match(
    chapterEightLogit,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch08_mlp\/logit_regression\.ipynb/,
  );

  const chapterEightTraining = await html("/books/deconstructing_LLM/chapter-8/8-5");
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
  await access(join(outputRoot, "generated", "book-images", "chapter_3", "3-23.png"));
  await access(join(outputRoot, "generated", "book-images", "chapter_4", "4-24.png"));
  await access(join(outputRoot, "generated", "book-images", "chapter_5", "5-13.png"));
  await access(join(outputRoot, "generated", "book-images", "chapter_6", "6-9.png"));
  await access(join(outputRoot, "generated", "book-images", "chapter_7", "7-28.png"));
  await access(join(outputRoot, "generated", "book-images", "chapter_8", "8-33.png"));
  const chapterNine = await html("/books/deconstructing_LLM/chapter-9/9-1");
  assert.match(chapterNine, /程序清单 9-1/);
  assert.match(chapterNine, /class="code-line" data-line-number="27"/);
  assert.match(chapterNine, /href="#eq-9-1">公式（9-1）<\/a>/);
  assert.match(
    chapterNine,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch09_cnn\/mlp\.ipynb/,
  );
  const chapterNineCnn = await html("/books/deconstructing_LLM/chapter-9/9-2");
  assert.match(chapterNineCnn, /id="eq-9-4"/);
  assert.match(chapterNineCnn, /程序清单 9-5/);
  assert.match(
    chapterNineCnn,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch09_cnn\/cnn\.ipynb/,
  );
  const chapterNineResNet = await html("/books/deconstructing_LLM/chapter-9/9-3");
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
  const chapterTen = await html("/books/deconstructing_LLM/chapter-10/10-5");
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
  const chapterElevenOverview = await html("/books/deconstructing_LLM/chapter-11");
  assert.match(
    chapterElevenOverview,
    new RegExp(`src="${basePath}/generated/book-images/chapter_11/11-1[.]png"`),
  );
  const chapterElevenAttention = await html("/books/deconstructing_LLM/chapter-11/11-1");
  assert.match(chapterElevenAttention, /id="eq-11-1"/);
  assert.match(chapterElevenAttention, /href="#eq-11-1">公式（11-1）<\/a>/);
  assert.match(
    chapterElevenAttention,
    new RegExp(`src="${basePath}/generated/book-images/chapter_11/11-2[.]png"`),
  );
  const chapterElevenGpt = await html("/books/deconstructing_LLM/chapter-11/11-2");
  assert.match(chapterElevenGpt, /程序清单 11-1/);
  assert.match(chapterElevenGpt, /程序清单 11-3/);
  assert.match(chapterElevenGpt, /class="code-line" data-line-number="23"/);
  assert.match(
    chapterElevenGpt,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch11_llm\/char_gpt\.ipynb/,
  );
  const chapterElevenTuning = await html("/books/deconstructing_LLM/chapter-11/11-4");
  assert.match(chapterElevenTuning, /程序清单 11-4/);
  assert.match(
    chapterElevenTuning,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch11_llm\/lora_tutorial\.ipynb/,
  );
  const chapterElevenReward = await html("/books/deconstructing_LLM/chapter-11/11-5");
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
  const chapterTwelveOptimization = await html("/books/deconstructing_LLM/chapter-12/12-1");
  assert.match(chapterTwelveOptimization, /id="eq-12-1"/);
  assert.match(chapterTwelveOptimization, /href="#eq-12-1">公式（12-1）<\/a>/);
  assert.match(chapterTwelveOptimization, /程序清单 12-1/);
  assert.match(chapterTwelveOptimization, /class="code-line" data-line-number="33"/);
  assert.match(
    chapterTwelveOptimization,
    /https:\/\/github\.com\/GenTang\/regression2chatgpt\/blob\/zh\/ch12_rl\/intuition_model\.ipynb/,
  );
  const chapterTwelveValue = await html("/books/deconstructing_LLM/chapter-12/12-3");
  assert.match(chapterTwelveValue, /id="eq-12-13"/);
  assert.match(chapterTwelveValue, /程序清单 12-2/);
  assert.match(chapterTwelveValue, /class="code-line" data-line-number="17"/);
  const chapterTwelvePolicy = await html("/books/deconstructing_LLM/chapter-12/12-4");
  assert.match(chapterTwelvePolicy, /程序清单 12-3/);
  assert.match(chapterTwelvePolicy, /class="code-line" data-line-number="14"/);
  const chapterTwelvePpo = await html("/books/deconstructing_LLM/chapter-12/12-5");
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
  const home = await html("/");
  const reading = await html("/books/deconstructing_LLM/chapter-4/4-2");
  const styles = await readFile(resolve("app/globals.css"), "utf8");
  const header = await readFile(resolve("app/components/SiteHeader.tsx"), "utf8");
  const tocScroller = await readFile(resolve("app/components/ActiveTocScroller.tsx"), "utf8");

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
});
