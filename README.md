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

### 通知 IndexNow

IndexNow 用于在内容新增、修改、删除或迁移后通知 Bing 等支持该协议的搜索引擎。首次使用先生成公开验证文件：

```bash
./scripts/indexnow.sh --init
```

脚本按 IndexNow 官方约定生成 `public/<Key>.txt`，其中**文件名（不含 `.txt`）与文件内容相同**。
如果已经手工创建了这种 Key 文件，脚本会自动识别，无需再次运行 `--init`。将文件一并提交、推送，
并等待 GitHub Pages 部署完成；确认 `https://gentang.github.io/<Key>.txt` 可以打开后，
全站迁移或首次接入可执行一次：

```bash
./scripts/indexnow.sh --all
```

日常更新只提交真正发生变化的页面，并且要在 GitHub Pages 部署完成后执行：

```bash
./scripts/indexnow.sh /zh/blog/example/ /en/blog/example/
```

提交前可以用 `--dry-run` 检查 URL。`--all` 会读取 `out/sitemap.xml`，因此需要先运行
`./scripts/publish.sh`。IndexNow 不替代 sitemap，也不会加快 Google 收录。

### 临时生成 Medium 导入页

Medium 的网页导入对公式、WebP 图片和嵌套列表支持有限。下面的命令会在构建时生成专用的临时 HTML：本地图片只在 `out/medium-import/` 中转换为 PNG，块级公式转换为图片，原始 Markdown 和 `images/` 不会被修改。临时页不会出现在站内导航、RSS 或 sitemap 中，并带有 `noindex`；但 URL 是公开且可预测的，不是带密码的私有页面。

生成单篇内容，可以传 Markdown 路径或线上页面路径：

```bash
pnpm medium:stage -- /en/blog/watermarking_on_aigc/
```

一次生成多篇内容，传入多个参数：

```bash
pnpm medium:stage -- /en/blog/watermarking_on_aigc/ /en/blog/watermarking_on_aigc_2/
```

生成整章时传入章节目录；脚本会递归读取该目录内的全部 Markdown：

```bash
pnpm medium:stage -- content/en/books/deconstructing_LLM/chapter_3
```

生成全部中英文博客和书稿：

```bash
pnpm medium:stage -- --all
```

`medium:stage` 会覆盖上一次选择，并把文件列表写入 `medium-import.json`。每次运行 `./scripts/publish.sh` 都会生成一个新的时间版本路径，并在终端末尾打印完整 URL；旧版本会从本次 `out/` 中清除，避免 Medium 继续使用上一次的导入缓存。也可以在构建后运行 `pnpm medium:status` 再次查看本次 URL。提交、推送并等待 GitHub Pages 部署后，再把这个新地址粘贴到 Medium Import Tool。导入完成后请先做两项检查：

1. 在 Medium 中把 canonical link 改为“小胖笔记”的原始文章 URL，避免 canonical 留在临时导入页。
2. 复制 Medium 正文中每张图片的地址，确认已经是 `miro.medium.com` 等 Medium 自有地址，不再依赖 `gentang.github.io/medium-import/`。

确认无误后可以撤下某一篇、一个章节，或全部临时页：

```bash
pnpm medium:remove -- /en/blog/watermarking_on_aigc/
pnpm medium:remove -- content/en/books/deconstructing_LLM/chapter_3
pnpm medium:remove
```

提交并推送删除后的状态；下次部署会清除 `/medium-import/`，原临时 URL 随后返回 404。

## 更新博客和书籍

日常内容都在 `content/` 目录中。

### 博客

- 中文博客：`content/zh/blog/`
- 英文博客：`content/en/blog/`

每篇博客使用一个 Markdown 文件。

目录型博客统一使用 `content/{语言}/blog/{slug}/{slug}.md`，并在
`content/{语言}/site.json` 的 `essay.posts` 中登记。页面路由位于
`app/{语言}/blog/{slug}/page.tsx`，可以复制现有博客路由后修改正文路径、URL 和图片目录。
首页展示 `essay.posts` 中的第一篇，博客页展示其中的全部文章，因此请按发布时间倒序排列。

已发布的博客在文件顶部维护日期，统一使用 `YYYY-MM-DD`：

```markdown
---
published: 2026-08-12
updated: 2026-08-12
---
```

首次发布后保留 `published` 不变；正文有实质修改时再更新 `updated`。草稿可以暂不填写日期。

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
