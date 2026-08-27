# 小胖笔记

“小胖笔记”的网站代码与 Markdown 内容。网站使用 Next.js 静态导出，并通过 GitHub Actions 发布到 GitHub Pages。

## 本地调试

首次使用需要安装 Node.js 22 或更高版本，然后在项目根目录运行：

```bash
./scripts/dev.sh
```

脚本会自动选择 `pnpm`、`corepack` 或 `npm`，并在首次运行时安装依赖。

启动后访问：

- 中文站点：<http://localhost:3000/zh/>
- 英文站点：<http://localhost:3000/en/>

修改 Markdown、配置文件或图片后，开发服务器会自动更新页面。按 `Control + C` 停止服务。

发布前可以生成并检查最终静态网站：

```bash
./scripts/publish.sh
./scripts/preview.sh
```

预览地址为 <http://localhost:3001>。生成的静态网站位于 `out/`，无需手工修改其中的文件。

## 推送与线上发布

确认本地预览无误后运行：

```bash
git status
git add .
git commit -m "更新网站内容"
git push
```

推送到 `main` 分支后，GitHub Actions 会自动构建并发布网站。可在仓库的 `Actions` 页面查看部署状态。

线上地址：<https://gentang.github.io/>

## 更新博客和书籍

日常内容都在 `content/` 目录中。

### 博客

- 中文博客：`content/zh/blog/`
- 英文博客：`content/en/blog/`

每篇博客使用一个独立目录，正文统一放在 `content/{语言}/blog/{slug}/{slug}.md`，
图片放在同目录的 `pic/` 中。保存 Markdown 后，开发服务会自动把文章加入首页、博客列表、
正文路由和搜索；发布构建还会自动更新 sitemap 与订阅源，不需要登记 `site.json` 或复制页面代码。
文章按 `published` 日期自动倒序排列。

已发布的博客在文件顶部维护日期，统一使用 `YYYY-MM-DD`：

```markdown
---
published: 2026-08-12
updated: 2026-08-12
summary: 一句话概括文章内容。
seo_title: 可选；用于搜索结果的精简标题。
seo_description: 可选；用于搜索结果的独立摘要。
topic: LLM
---
```

首次发布后保留 `published` 不变；正文有实质修改时再更新 `updated`。未准备公开的文章请增加
`draft: true`，发布时改为 `false` 或删除这一行。

页面标题和摘要默认从正文标题及 `summary` 自动生成；只有正文标题较长，或希望搜索结果使用不同文案时，
才需要填写 `seo_title` 与 `seo_description`。发布脚本会自动清理 Markdown 标记并限制过长的元数据。

### 《解构大语言模型》

- 中文书稿：`content/zh/books/deconstructing_LLM/`
- 英文书稿：`content/en/books/deconstructing_LLM/`
- 全书总览：书籍目录下的 `overview.md`
- 书名、简介、章节信息和外部链接：书籍目录下的 `book.json`
- 章节总览：`chapter_N/overview.md`
- 章节小节：`chapter_N/N_M.md`
- 章节图片：`chapter_N/images/`

全书的发布日期、完成日期和最近修订日期维护在 `book.json` 的 `dates` 中。每章的 `published`、`updated` 维护在该章 `overview.md` 顶部，小节默认继承本章日期；只有某个小节单独修订时，才在该小节 Markdown 顶部用相同格式覆盖日期。

发布日期会自动用于页面显示、SEO、`sitemap.xml`、RSS 和 Atom；不要直接修改生成的 `.generated/` 或 `out/` 文件。

新增章节或小节后，网站会根据目录和 Markdown 文件自动更新书籍导航。

### 其他常用内容

- 中文首页：`content/zh/site.json`
- 英文首页：`content/en/site.json`
- 中文作者介绍：`content/zh/about.md`
- 英文作者介绍：`content/en/about.md`
