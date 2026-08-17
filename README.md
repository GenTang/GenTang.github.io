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

## 更新博客和书籍

日常内容都在 `content/` 目录中。

### 博客

- 中文博客：`content/zh/blog/`
- 英文博客：`content/en/blog/`

每篇博客使用一个 Markdown 文件。

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
