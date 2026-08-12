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

每篇博客使用一个 Markdown 文件。

### 《解构大语言模型》

- 中文书稿：`content/zh/books/deconstructing_LLM/`
- 英文书稿：`content/en/books/deconstructing_LLM/`
- 全书总览：书籍目录下的 `overview.md`
- 书名、简介、章节信息和外部链接：书籍目录下的 `book.json`
- 章节总览：`chapter_N/overview.md`
- 章节小节：`chapter_N/N_M.md`
- 章节图片：`chapter_N/images/`

新增章节或小节后，网站会根据目录和 Markdown 文件自动更新书籍导航。

### 其他常用内容

- 中文首页：`content/zh/site.json`
- 英文首页：`content/en/site.json`
- 中文作者介绍：`content/zh/about.md`
- 英文作者介绍：`content/en/about.md`
