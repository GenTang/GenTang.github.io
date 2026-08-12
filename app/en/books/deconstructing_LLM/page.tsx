/* eslint-disable @next/next/no-img-element -- Local book artwork is exported as a static asset. */
import type { Metadata } from "next";
import bookConfig from "@/content/en/books/deconstructing_LLM/book.json";
import outlineImage from "@/content/en/books/deconstructing_LLM/deconstructing-llm-outline.png";
import { MarkdownContent } from "@/app/components/MarkdownContent";
import { SiteFooter } from "@/app/components/SiteFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { getMarkdownContent } from "@/app/lib/content";
import { sitePath } from "@/app/lib/sitePath";
import { createPageMetadata } from "@/app/lib/siteMetadata";

const overviewSource = getMarkdownContent("/content/en/books/deconstructing_LLM/overview.md");
const firstChapterHref = "/en/books/deconstructing_LLM/chapter-1";
const chapterCount = Object.keys(bookConfig.chapterTitles).length;

export const metadata: Metadata = createPageMetadata({
  title: `${bookConfig.title}: ${bookConfig.subtitle}`,
  description: bookConfig.overview.seoDescription,
  path: "/en/books/deconstructing_LLM",
  locale: "en_US",
  alternatePath: "/zh/books/deconstructing_LLM",
  kind: "website",
  keywords: bookConfig.overview.keywords,
});

export default function EnglishDeconstructingLlmOverview() {
  return (
    <div className="site-shell book-overview-shell">
      <SiteHeader
        lang="en"
        active="book"
        languageHref="/zh/books/deconstructing_LLM"
      />

      <main className="book-overview-main">
        <section className="book-overview-hero">
          <a
            className="overview-cover-link"
            href={sitePath(firstChapterHref)}
            aria-label={`Start reading ${bookConfig.title}`}
          >
            <img
              src={sitePath(bookConfig.overview.coverImage)}
              alt={`${bookConfig.title}: ${bookConfig.subtitle}`}
            />
            <span>Click the cover to start reading <b>↗</b></span>
          </a>

          <div className="book-overview-intro">
            <div className="book-overview-meta">
              <span className="book-overview-kicker">{bookConfig.overview.kicker}</span>
              <span className="book-overview-complete">Book complete · {chapterCount} chapters</span>
            </div>
            <h1>
              {bookConfig.title}
              <small>{bookConfig.subtitle}</small>
            </h1>
            <p>{bookConfig.overview.description}</p>
            <span className="book-overview-author">Author · {bookConfig.author}</span>
            <div className="book-overview-dates">
              <span>Published online <time dateTime={bookConfig.dates.published}>{bookConfig.dates.published}</time></span>
              <span>Completed <time dateTime={bookConfig.dates.completed}>{bookConfig.dates.completed}</time></span>
              {bookConfig.dates.updated !== bookConfig.dates.completed && (
                <span>Last revised <time dateTime={bookConfig.dates.updated}>{bookConfig.dates.updated}</time></span>
              )}
            </div>

            <div className="book-overview-actions">
              <a className="primary-link" href={sitePath(firstChapterHref)}>
                Start with Chapter 1 <span>→</span>
              </a>
              <a
                className="secondary-link"
                href={bookConfig.overview.githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                Companion Code <span>↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="book-overview-content">
          <div className="book-overview-reading">
            <article className="book-overview-prose">
              <MarkdownContent source={overviewSource} />
            </article>
            <figure className="book-outline-figure">
              <img
                src={sitePath(outlineImage.src)}
                alt="The conceptual roadmap of Deconstructing Large Language Models"
              />
            </figure>
          </div>

          <div className="book-roadmap" aria-label="Reading map">
            <span className="book-roadmap-label">READING MAP</span>
            <div className="book-roadmap-grid">
              {bookConfig.parts.map((part, index) => (
                <article key={part.label}>
                  <span>0{index + 1}</span>
                  <small>{part.label}</small>
                  <h3>
                    <a href={sitePath(`/en/books/deconstructing_LLM/chapter-${part.chapters[0]}`)}>
                      {part.title}
                    </a>
                  </h3>
                  <p>{part.description}</p>
                  <nav aria-label={`${part.title} chapters`}>
                    {part.chapters.map((chapter) => (
                      <a
                        href={sitePath(`/en/books/deconstructing_LLM/chapter-${chapter}`)}
                        key={chapter}
                      >
                        Chapter {chapter}
                      </a>
                    ))}
                  </nav>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter lang="en" />
    </div>
  );
}
