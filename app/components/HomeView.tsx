import type { CSSProperties } from "react";
import enContent from "@/content/en/site.json";
import zhContent from "@/content/zh/site.json";
import { sitePath } from "@/app/lib/sitePath";
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
  const { hero, book, essay } = content;

  return (
    <div
      className="site-shell"
      style={{ "--hero-manuscript": `url("${sitePath("/images/galois-manuscript.jpg")}")` } as CSSProperties}
    >
      <SiteHeader lang={lang} languageHref={lang === "en" ? "/" : "/en/"} />
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
              <span>NOTE / 001</span>
              <span className="live-state">{hero.updateState}</span>
            </div>
            <pre><code><span className="code-keyword">def</span> <span className="code-name">understand</span>(question):{"\n"}    evidence = observe(question){"\n"}    <span className="code-keyword">return</span> revise(evidence)</code></pre>
            <div className="formula" aria-label="Bayesian update formula">P(H|E) ∝ P(E|H) · P(H)</div>
          </aside>
        </section>

        <section className="content-section essay-section">
          <div className="section-heading">
            <div><span>{essay.sectionLabel}</span>{essay.sectionTitle && <h2>{essay.sectionTitle}</h2>}</div>
            <p>{essay.sectionDescription}</p>
          </div>
          {essay.available ? <a className="essay-row" href={sitePath(essay.href)}>
            <span className="essay-date">{essay.date}</span>
            <span className="essay-title">{essay.title}</span>
            <span className="essay-topic">{essay.topic}</span>
            <span className="essay-arrow">↗</span>
          </a> : <div className="essay-row is-disabled" aria-label={essay.title}>
            <span className="essay-date">{essay.date}</span>
            <span className="essay-title">{essay.title}</span>
            <span className="essay-topic">{essay.topic}</span>
            <span className="essay-arrow">…</span>
          </div>}
        </section>

        <section className="content-section books-section">
          <div className="section-heading">
            <div><span>{book.sectionLabel}</span>{book.sectionTitle && <h2>{book.sectionTitle}</h2>}</div>
            <p>{book.sectionDescription}</p>
          </div>

          <article className="book-feature">
            <div className="book-cover">
              {/* eslint-disable-next-line @next/next/no-img-element -- User-provided cover is a public static asset. */}
              <img className="book-cover-image" src={sitePath(book.coverImage)} alt={`${book.title}：${book.subtitle}`} />
            </div>
            <div className="book-details">
              <span className="status-label">{book.status}</span>
              <h3>{book.title}</h3>
              <p className="book-subtitle">{book.subtitle}</p>
              <p className="book-description">{book.description}</p>
              <div className="chapter-line"><span>{book.publishedLabel}</span><strong>{book.publishedValue}</strong></div>
              <a className="text-link" href={sitePath(book.chapterHref)}>{book.chapterLabel}<span>↗</span></a>
            </div>
          </article>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
