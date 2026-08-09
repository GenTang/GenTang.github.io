# 小胖笔记

“小胖笔记”的源代码和 Markdown 内容。网站使用 Next.js 静态导出，由 GitHub Actions 发布到 GitHub Pages。

## 日常更新

书稿和博客都在 `content/`：

- `content/zh/site.json`：中文首页文案和链接
- `content/en/site.json`：英文首页文案和链接
- `content/zh/books/deconstructing_LLM/`：中文书稿
- `content/zh/blog/`、`content/en/blog/`：博客

每一章使用一个 `chapter_N/` 文件夹，小节使用独立 Markdown 文件，图片放在该章的 `images/` 中。新增章节和小节后，全书目录会在开发和构建时自动更新。

首页的“已发布”章数和“阅读最新章节”链接也从这些 Markdown 自动计算：只要章节目录中存在 Markdown，它就会计入；空章节目录不会提前显示。博客的 `available` 为 `false` 时，首页主按钮会自动指向最新书稿；以后正式发布博客并改为 `true`，它会改用 `site.json` 中配置的博客链接。

## 本地浏览

直接运行：

```bash
git clone https://github.com/GenTang/GenTang.github.io.git
cd GenTang.github.io
./scripts/dev.sh
```

然后打开 [http://localhost:3000](http://localhost:3000)。修改 Markdown、首页 JSON 或章节图片后，开发服务器会重新生成内容索引并刷新页面。按 `Control + C` 停止服务。

脚本会自动使用系统中的 `pnpm`、`corepack` 或 `npm`，首次运行时会安装依赖。项目不依赖任何特定电脑、用户目录或开发工具的私有运行环境。

如果电脑已经安装 Node.js 22 和 pnpm，也可以直接运行：

```bash
pnpm install
pnpm run dev
```

## 本地发布检查

内容确认后运行：

```bash
./scripts/publish.sh
```

这个命令会检查代码、生成所有章节的静态 HTML 并运行页面测试。成功后，静态网站位于 `out/`。它不会 commit，也不会 push。

构建过程还会自动生成以下公开文件，不要手工维护 `out/` 中的副本：

- `sitemap.xml`：包含当前可公开检索的首页、书籍总览、章节、小节和已发布博客
- `robots.txt`：允许普通搜索与回答型爬虫，拒绝已明确列出的模型训练爬虫
- `rss.xml`、`atom.xml`：按最新章节在前的顺序提供订阅

博客占位页带有 `noindex`，不会进入站点地图；正式发布时再解除。

如需检查最终静态文件：

```bash
./scripts/preview.sh
```

然后打开 [http://localhost:3001](http://localhost:3001)。

## 提交和上线

发布检查成功后，由你自己提交和推送：

```bash
git status
git add .
git commit -m "更新书稿"
git push
```

推送到 `main` 后，`.github/workflows/pages.yml` 会运行同样的静态构建并部署 `out/`。首次使用时，需要在 GitHub 仓库的 `Settings → Pages → Build and deployment` 中把 `Source` 设为 `GitHub Actions`。

当前远程仓库属于 `GenTang`，仓库名也是 `GenTang.github.io`，因此默认 Pages 地址是：

```text
https://gentang.github.io/
```

上线后可分别向 Google Search Console 和 Bing Webmaster Tools 提交：

```text
https://gentang.github.io/sitemap.xml
```

站点页脚提供 RSS、Atom 和版权说明入口。页面分享摘要、canonical 地址和中英文首页的语言对应关系会在构建时生成。

工作流也支持普通项目仓库；如果以后更改仓库名，它会自动处理对应的子路径。

## 授权

网站代码采用 MIT License。书稿、博客内容、封面和原创图片不包含在 MIT 授权中，保留全部权利；详见 `LICENSE`。

## 关于 `next-env.d.ts`

`next-env.d.ts` 由 Next.js 自动生成，不应手工编辑。`next dev` 会引用 `.next/dev/types/routes.d.ts`，`next build` 会引用 `.next/types/routes.d.ts`；二者分别对应开发和生产类型目录，切换命令时自动变化是正常现象。本项目的 `tsconfig.json` 已同时包含这两个生成目录。
