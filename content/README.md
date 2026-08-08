# 内容更新指南

这个目录是网站日常更新的入口，不需要改页面组件。

运行 `./scripts/dev.sh` 后，保存 Markdown、JSON 或章节图片会重新生成内容索引并刷新页面。新增章节文件夹或小节也会自动加入全书目录。

## 首页文案和按钮

- 中文：`content/zh/site.json`
- 英文：`content/en/site.json`
- `hero.primaryCta` 控制首页主按钮的文字和链接。
- `hero.secondaryCta` 控制首页次按钮的文字和链接。

## 正文

- 中文书稿目录：`content/zh/books/deconstructing_LLM/`
- 第一章概览：`content/zh/books/deconstructing_LLM/chapter_1/overview.md`
- 第一章小节：`content/zh/books/deconstructing_LLM/chapter_1/1_1.md` 等
- 英文第一章：`content/en/books/ai-systems/chapter-1.md`
- 中文博客：`content/zh/blog/ai-as-collaborator.md`
- 英文博客：`content/en/blog/ai-as-collaborator.md`

Markdown 支持标题、列表、引用、表格、代码高亮和数学公式。行内公式写作 `$E=mc^2$`，独立公式使用一对 `$$` 包裹。

每一章拥有独立文件夹，小节各自使用一个 Markdown 文件；该章图片放在章目录下的 `images/`，正文中使用 `./images/文件名` 引用。

新增第三章时，可以采用下面的结构：

```text
chapter_3/
├── overview.md
├── 3_1.md
├── 3_2.md
└── images/
```

章节名取自 `overview.md` 的第一个标题，小节名取自各小节 Markdown 的第一个标题。`overview.md` 只作为点击章节名后的页面，不会重复显示在第二级目录中。

全书两层目录配置位于 `content/zh/books/deconstructing_LLM/book.json`。
