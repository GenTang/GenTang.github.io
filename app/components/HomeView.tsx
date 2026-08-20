import type { CSSProperties } from "react";
import enContent from "@/content/en/site.json";
import zhContent from "@/content/zh/site.json";
import { getDeconstructingLlmNavigation } from "@/app/lib/deconstructingLlmContent";
import { sitePath } from "@/app/lib/sitePath";
import { getBlogMarkdownMetadata } from "@/app/lib/content";
import { BlogStatus } from "./BlogStatus";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

function highlightedTitle(line: string) {
  return line.split(/(【[^】]+】)/g).map((part, index) =>
    part.startsWith("【") && part.endsWith("】")
      ? <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
      : part,
  );
}

export function HomeView({ lang }: { lang: "zh" | "en" }) {
  const content = lang === "en" ? enContent : zhContent;
  const { hero, book } = content;
  const posts = content.essay.posts.slice(0, 3).map((post) => {
    const blogDates = getBlogMarkdownMetadata(lang, post.href);
    return { ...post, date: blogDates.published ?? post.date };
  });
  const essay = {
    ...content.essay,
    posts,
  };
  const publishedChapters = getDeconstructingLlmNavigation(lang).chapters.filter(
    (chapter) => chapter.href,
  );

  return (
    <div
      className="site-shell"
      style={{ "--hero-manuscript": `url("${sitePath("/images/galois-manuscript.webp")}")` } as CSSProperties}
    >
      <SiteHeader lang={lang} languageHref={lang === "en" ? "/zh/" : "/en/"} />
      <main>
        <section className="home-hero">
          <div className="hero-copy">
            {hero.eyebrow && <p className="eyebrow">{hero.eyebrow}</p>}
            <h1>
              {highlightedTitle(hero.title[0])}<br />
              {highlightedTitle(hero.title[1])}
            </h1>
            <p className="hero-intro">{hero.intro}</p>
            <div className="hero-actions">
              <a className="primary-link" href={sitePath(hero.primaryCta.href)}>
                {hero.primaryCta.label}<span>→</span>
              </a>
              <a className="secondary-link" href={sitePath(hero.secondaryCta.href)}>
                {hero.secondaryCta.label}
              </a>
            </div>
          </div>

          <aside className="research-card" aria-label={hero.previewLabel}>
            <div className="research-meta">
              <span className="live-state">{hero.updateState}</span>
            </div>
            <pre><code><span className="code-keyword">def</span> <span className="code-name">understand</span>(question):{"\n"}    evidence = observe(question){"\n"}    <span className="code-keyword">return</span> revise(evidence)</code></pre>
            <div className="formula" aria-label="Bayesian update formula">P(H|E) ∝ P(E|H) · P(H)</div>
          </aside>
        </section>

        <BlogStatus essay={essay} />

        <section className="content-section books-section">
          <div className="section-heading">
            <div><span>{book.sectionLabel}</span>{book.sectionTitle && <h2>{book.sectionTitle}</h2>}</div>
            {book.sectionDescription && <p>{book.sectionDescription}</p>}
          </div>

          <article className="book-feature">
            <a className="book-cover" href={sitePath(book.overviewHref)} aria-label={book.overviewLabel}>
              {/* eslint-disable-next-line @next/next/no-img-element -- User-provided cover is a public static asset. */}
              <img className="book-cover-image" src={sitePath(book.coverImage)} alt={`${book.title}：${book.subtitle}`} />
            </a>
            <div className="book-details">
              <span className="status-label">{book.status}</span>
              <h3><a href={sitePath(book.overviewHref)}>{book.title}</a></h3>
              <p className="book-subtitle">{book.subtitle}</p>
              <p className="book-description">{book.description}</p>
              <div className="book-link-group">
                <a className="text-link is-overview" href={sitePath(book.overviewHref)}>{book.overviewLabel}<span>→</span></a>
                <nav className="home-book-chapters" aria-label={lang === "zh" ? "按章节阅读" : "Read by chapter"}>
                  {publishedChapters.map((chapter) => {
                    if (!chapter.href) return null;
                    const chapterNumber = chapter.id.match(/\d+$/)?.[0] ?? chapter.id;

                    return (
                      <a href={sitePath(chapter.href)} key={chapter.id} title={chapter.title}>
                        {lang === "zh" ? `第 ${chapterNumber} 章` : `Chapter ${chapterNumber}`}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>
          </article>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
