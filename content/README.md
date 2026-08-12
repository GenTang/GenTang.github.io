# 内容更新指南

这个目录是网站日常更新的入口，不需要改页面组件。

运行 `./scripts/dev.sh` 后，保存 Markdown、JSON 或章节图片会重新生成内容索引并刷新页面。新增章节文件夹或小节也会自动加入全书目录。

## 首页文案和按钮

- 中文：`content/zh/site.json`
- 英文：`content/en/site.json`
- `hero.primaryCta` 控制首页主按钮的文字和链接。
- `hero.secondaryCta` 控制首页次按钮的文字和链接。

## 关于与联系

- 中文作者介绍：`content/zh/about.md`
- 英文作者介绍：`content/en/about.md`
- 联系与反馈入口位于 `app/components/AboutPage.tsx`，包括电子邮件、网站 Issue 和 GitHub Discussion。

站内搜索会在内容索引更新时自动读取这些 Markdown，并生成 `public/generated/search-index.json`。修改或新增书稿、博客、About 内容后，不需要手工维护搜索关键词。

## 评论

书稿和正式博客正文底部使用 Giscus，与 GitHub Discussions 对应。仓库已经安装 Giscus App，网站默认使用 `Announcements` 分类，无需再配置即可启用。

只有以后更换 Discussion 分类时，才需要在本地 `.env.local` 覆盖默认值：

```text
NEXT_PUBLIC_GISCUS_CATEGORY=Announcements
NEXT_PUBLIC_GISCUS_CATEGORY_ID=DIC_kwDOTyPYts4DDMt3
```

如需在 GitHub Actions 中覆盖，也可以配置同名仓库变量。评论按页面路径映射，中英文及各章节会拥有独立 Discussion；博客占位页不会显示评论。评论区随页面自动载入，阅读已有评论不需要登录，发表和互动需要登录 GitHub。

## 正文

- 中文书稿目录：`content/zh/books/deconstructing_LLM/`
- 全书总览（内容简介）：`content/zh/books/deconstructing_LLM/overview.md`
- 第一章概览：`content/zh/books/deconstructing_LLM/chapter_1/overview.md`
- 第一章小节：`content/zh/books/deconstructing_LLM/chapter_1/1_1.md` 等
- 英文书稿目录：`content/en/books/deconstructing_LLM/`，目录结构与中文版本一致；英文全书总览为该目录下的 `overview.md`
- 中文博客：`content/zh/blog/ai-as-collaborator.md`
- 英文博客：`content/en/blog/ai-as-collaborator.md`

Markdown 支持标题、列表、引用、表格、代码高亮和数学公式。行内公式写作 `$E=mc^2$`，独立公式使用一对 `$$` 包裹。

每一章拥有独立文件夹，小节各自使用一个 Markdown 文件；该章图片放在章目录下的 `images/`，正文中使用 `./images/文件名` 引用。

书籍根目录下的 `overview.md` 是全书总览，只存放总览页的 Markdown 正文；总览页使用的大纲图也放在该书根目录。`book.json` 存放书名、作者、外部链接、阅读路径以及全书和各章的 SEO 摘要与关键词等结构化信息。各章目录中的 `overview.md` 则是对应章节的概览页。

新增第三章时，可以采用下面的结构：

```text
chapter_3/
├── overview.md
├── 3_1.md
├── 3_2.md
└── images/
```

章节名取自 `overview.md` 的第一个标题，小节名取自各小节 Markdown 的第一个标题。`overview.md` 只作为点击章节名后的页面，不会重复显示在第二级目录中。

中英文全书两层目录配置分别位于 `content/zh/books/deconstructing_LLM/book.json` 和 `content/en/books/deconstructing_LLM/book.json`。
