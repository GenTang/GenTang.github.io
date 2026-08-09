import { sitePath } from "@/app/lib/sitePath";

export function SiteFooter({ lang }: { lang: "zh" | "en" }) {
  const isZh = lang === "zh";

  return (
    <footer className="site-footer" id="about">
      <div>
        <strong>小胖笔记</strong>
        <p>{isZh ? "把复杂的问题想清楚，再慢慢写下来。" : "Think through hard questions, then write them down slowly."}</p>
      </div>
      <div className="footer-meta">
        <span>{isZh ? "© 2026 唐亘 · 小胖笔记" : "© 2026 Gen Tang · Xiaopang Notes"}</span>
        <span>{isZh
          ? "书稿、博客与原创图片保留全部权利；引用请注明作者和原文链接。"
          : "Book drafts, essays, and original images are all rights reserved; please cite the author and source URL."}</span>
        <nav className="footer-links" aria-label={isZh ? "订阅与版权" : "Feeds and copyright"}>
          <a href={sitePath("/rss.xml")}>RSS</a>
          <a href={sitePath("/atom.xml")}>Atom</a>
          <a href="https://github.com/GenTang/GenTang.github.io/blob/main/LICENSE" target="_blank" rel="noreferrer">
            {isZh ? "版权说明" : "License"}
          </a>
        </nav>
      </div>
    </footer>
  );
}
