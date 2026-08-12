/* eslint-disable @next/next/no-img-element -- Local book artwork is exported as a static asset. */
import type { Metadata } from "next";
import bookConfig from "@/content/zh/books/deconstructing_LLM/book.json";
import outlineImage from "@/content/zh/books/deconstructing_LLM/deconstructing-llm-outline.png";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { getMarkdownContent } from "@/app/lib/content";
import { sitePath } from "@/app/lib/sitePath";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const overviewSource = getMarkdownContent("/content/zh/books/deconstructing_LLM/overview.md");
const firstChapterHref = "/zh/books/deconstructing_LLM/chapter-1";
const chapterCount = Object.keys(bookConfig.chapterTitles).length;

export const metadata: Metadata = createPageMetadata({
  title: `${bookConfig.title}：${bookConfig.subtitle}`,
  description: bookConfig.overview.seoDescription,
  path: "/zh/books/deconstructing_LLM",
  alternatePath: "/en/books/deconstructing_LLM",
  kind: "website",
  keywords: bookConfig.overview.keywords,
});

export default function DeconstructingLlmOverview() {
  return (
    <div className="site-shell book-overview-shell">
      <SiteHeader
        lang="zh"
        active="book"
        languageHref="/en/books/deconstructing_LLM"
      />

      <main className="book-overview-main">
        <section className="book-overview-hero">
          <a
            className="overview-cover-link"
            href={sitePath(firstChapterHref)}
            aria-label={`开始阅读《${bookConfig.title}》`}
          >
            <img
              src={sitePath(bookConfig.overview.coverImage)}
              alt={`${bookConfig.title}：${bookConfig.subtitle}`}
            />
            <span>点击封面开始阅读 <b>↗</b></span>
          </a>

          <div className="book-overview-intro">
            <div className="book-overview-meta">
              <span className="book-overview-kicker">{bookConfig.overview.kicker}</span>
              <span className="book-overview-complete">全书已完成 · {chapterCount} 章</span>
            </div>
            <h1>
              {bookConfig.title}
              <small>{bookConfig.subtitle}</small>
            </h1>
            <p>{bookConfig.overview.description}</p>
            <span className="book-overview-author">作者 · {bookConfig.author}</span>
            <div className="book-overview-dates">
              <span>在线发布 <time dateTime={bookConfig.dates.published}>{bookConfig.dates.published}</time></span>
              <span>全书完成 <time dateTime={bookConfig.dates.completed}>{bookConfig.dates.completed}</time></span>
              {bookConfig.dates.updated !== bookConfig.dates.completed && (
                <span>最近修订 <time dateTime={bookConfig.dates.updated}>{bookConfig.dates.updated}</time></span>
              )}
            </div>

            <div className="book-overview-actions">
              <a className="primary-link" href={sitePath(firstChapterHref)}>从第一章开始 <span>→</span></a>
              <a className="secondary-link" href={bookConfig.overview.videoUrl} target="_blank" rel="noreferrer">视频解读 <span>↗</span></a>
              <a className="secondary-link" href={bookConfig.overview.githubUrl} target="_blank" rel="noreferrer">配套代码 <span>↗</span></a>
            </div>
          </div>
        </section>

        <section className="book-overview-content">
          <div className="book-overview-reading">
            <article className="book-overview-prose">
              <MarkdownContent source={overviewSource} />
            </article>
            <figure className="book-outline-figure">
              <img src={sitePath(outlineImage.src)} alt="《解构大语言模型》全书知识脉络图" />
            </figure>
          </div>

          <div className="book-roadmap" aria-label="阅读路径">
            <span className="book-roadmap-label">READING MAP</span>
            <div className="book-roadmap-grid">
              {bookConfig.parts.map((part, index) => (
                <article key={part.label}>
                  <span>0{index + 1}</span>
                  <small>{part.label}</small>
                  <h3>
                    <a href={sitePath(`/zh/books/deconstructing_LLM/chapter-${part.chapters[0]}`)}>
                      {part.title}
                    </a>
                  </h3>
                  <p>{part.description}</p>
                  <nav aria-label={`${part.title}章节`}>
                    {part.chapters.map((chapter) => (
                      <a
                        href={sitePath(`/zh/books/deconstructing_LLM/chapter-${chapter}`)}
                        key={chapter}
                      >
                        第 {chapter} 章
                      </a>
                    ))}
                  </nav>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="zh" />
    </div>
  );
}
