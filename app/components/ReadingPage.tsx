import Link from "next/link";
import { sitePath } from "@/app/lib/sitePath";
import { ActiveTocScroller } from "./ActiveTocScroller";
import { BookTocControls } from "./BookTocControls";
import { MarkdownContent } from "./MarkdownContent";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type ReadingPageProps = {
  lang: "zh" | "en";
  kind: "book" | "blog";
  source: string;
  images?: Record<string, string>;
  article?: ReadingArticleMeta;
  bookNavigation?: BookNavigation;
  currentHref?: string;
  languageHref?: string;
  previousPage?: PaginationPage;
  nextPage?: PaginationPage;
  contentOnly?: boolean;
};

type PaginationPage = {
  title: string;
  href: string;
};

export type ReadingArticleMeta = {
  kicker: string;
  title: string;
  summary: string;
  readingTime: string;
  date: string;
  outline?: Array<{
    href: string;
    label: string;
  }>;
  showDraftNotice?: boolean;
};

type BookNavigation = {
  title: string;
  subtitle?: string;
  chapters: Array<{
    id: string;
    title: string;
    href?: string;
    sections: Array<{
      id: string;
      title: string;
      href: string;
    }>;
  }>;
};

export function ReadingPage({
  lang,
  kind,
  source,
  images,
  article,
  bookNavigation,
  currentHref,
  languageHref: providedLanguageHref,
  previousPage,
  nextPage,
  contentOnly = false,
}: ReadingPageProps) {
  const en = lang === "en";
  const isBook = kind === "book";
  const prefix = `/${lang}`;
  const languageHref = providedLanguageHref ?? (isBook
    ? (en ? "/zh/books/deconstructing_LLM/chapter-1" : "/en/books/deconstructing_LLM/chapter-1")
    : (en ? "/zh/blog/ai-as-collaborator" : "/en/blog/ai-as-collaborator"));

  const defaultBlogOutline = en
    ? [
        { href: "#the-real-shift", label: "01 · The real shift" },
        { href: "#a-collaborator-needs-a-shared-state", label: "02 · Collaboration" },
        { href: "#human-judgment-becomes-more-important", label: "03 · Human judgment" },
      ]
    : [
        { href: "#真正的变化不在答案", label: "01 · 真正的变化" },
        { href: "#协作者需要共享状态", label: "02 · 协作关系" },
        { href: "#人的判断反而更重要", label: "03 · 人的判断" },
      ];
  const blogOutline = article?.outline ?? defaultBlogOutline;
  const currentBookTitle = bookNavigation?.chapters
    .map((chapter) => {
      if (chapter.href === currentHref) return chapter.title;
      return chapter.sections.find((section) => section.href === currentHref)?.title;
    })
    .find((title): title is string => Boolean(title));
  const mobileOutlineTitle = isBook
    ? currentBookTitle ?? bookNavigation?.title ?? (en ? "Book contents" : "全书目录")
    : article?.title ?? (en ? "Article outline" : "文章目录");

  const renderSidebarContent = () => (
    <>
      {!isBook && (
        <a className="back-link" href={sitePath(`${prefix}/`)}>
          ← {en ? "Back to home" : "返回首页"}
        </a>
      )}
      {isBook ? (
        <>
          <div className="sidebar-book-title">
            <strong>{bookNavigation?.title ?? (en ? "Notes on AI Systems" : "解构大语言模型")}</strong>
            {bookNavigation?.subtitle && <span>{bookNavigation.subtitle}</span>}
          </div>
          {bookNavigation ? (
              <BookTableOfContents lang={lang} navigation={bookNavigation} currentHref={currentHref} />
          ) : (
            <nav aria-label={en ? "Book chapters" : "书籍章节"}>
              <a className="current-chapter" href={sitePath(`${prefix}/books/deconstructing_LLM/chapter-1`)}>01 · {en ? "Chapter 1: Introduction" : "绪论"}</a>
              <span>02 · {en ? "Models and representations" : "即将发布"}</span>
              <span>03 · {en ? "The role of context" : "即将发布"}</span>
            </nav>
          )}
          {en && <small>Upcoming chapters are placeholders for your manuscript.</small>}
        </>
      ) : (
        <>
          <span className="sidebar-label">AI ESSAY / 001</span>
          <strong>{en ? "Frontier notes" : "前沿笔记"}</strong>
          <nav aria-label={en ? "Article outline" : "文章目录"}>
            {blogOutline.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
          </nav>
        </>
      )}
    </>
  );

  return (
    <div className="site-shell reading-shell">
      <SiteHeader lang={lang} active={kind} languageHref={languageHref} />
      <main className={`reading-main ${isBook ? "book-reading-main" : "blog-reading-main"}`}>
        <aside className="reading-sidebar desktop-reading-sidebar">
          {renderSidebarContent()}
        </aside>

        <aside className="mobile-reading-sidebar">
          <details>
            <summary>
              <span>{isBook ? (en ? "CONTENTS" : "目录") : (en ? "OUTLINE" : "本文目录")}</span>
              <strong>{mobileOutlineTitle}</strong>
              <span className="mobile-reading-sidebar-arrow" aria-hidden="true">⌄</span>
            </summary>
            <div className="reading-sidebar mobile-reading-sidebar-panel">
              {renderSidebarContent()}
            </div>
          </details>
        </aside>

        <article className={`longform-article ${isBook ? "book-article" : "blog-article"}`}>
          {!contentOnly && article && (
            <>
              <header className="article-header">
                <span className="article-kicker">{article.kicker}</span>
                <h1>{article.title}</h1>
                <p>{article.summary}</p>
                <div className="article-meta"><span>{article.readingTime}</span><span>{article.date}</span></div>
              </header>

              {article.showDraftNotice !== false && (
                <div className="draft-notice">
                  <strong>{en ? "Continuously revised" : "持续修订"}</strong>
                  <span>{en ? "This text now comes from an editable Markdown file and can evolve without changing its URL." : "正文现已来自可直接编辑的 Markdown 文件，持续更新不会改变页面地址。"}</span>
                </div>
              )}
            </>
          )}

          <MarkdownContent lang={lang} source={source} images={images} />

          {isBook ? (
            <nav className="article-pagination" aria-label={en ? "Section navigation" : "小节导航"}>
              {previousPage ? (
                <a href={sitePath(previousPage.href)}>← {en ? "Previous" : "上一节"}：{previousPage.title}</a>
              ) : (
                <span>{en ? "Beginning of chapter" : "本章开始"}</span>
              )}
              {nextPage ? (
                <a href={sitePath(nextPage.href)}>{en ? "Next" : "下一节"}：{nextPage.title} →</a>
              ) : (
                <span>{en ? "End of chapter" : "本章结束"}</span>
              )}
            </nav>
          ) : <div className="article-endmark">胖 · 001</div>}
        </article>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}

function BookTableOfContents({
  lang,
  navigation,
  currentHref,
}: {
  lang: "zh" | "en";
  navigation: BookNavigation;
  currentHref?: string;
}) {
  const currentChapterId = navigation.chapters.find((chapter) =>
    chapter.href === currentHref || chapter.sections.some((section) => section.href === currentHref)
  )?.id;

  return (
    <nav className="book-toc" aria-label={lang === "en" ? "Book contents" : "全书目录"}>
      <ActiveTocScroller currentHref={currentHref} />
      <BookTocControls currentChapterId={currentChapterId} lang={lang} />
      {navigation.chapters.map((chapter) => {
        const chapterIsOpen = chapter.href === currentHref || chapter.sections.some((section) => section.href === currentHref);

        return (
          <details
            className={chapterIsOpen ? "toc-chapter is-open" : "toc-chapter"}
            data-chapter-id={chapter.id}
            key={chapter.id}
            open={chapterIsOpen}
          >
            <summary className="toc-chapter-summary">
              {chapter.href ? (
                <Link
                  aria-current={chapter.href === currentHref ? "page" : undefined}
                  className="toc-chapter-link"
                  href={sitePath(chapter.href)}
                >
                  {chapter.title}
                </Link>
              ) : (
                <span className="toc-chapter-link is-disabled">{chapter.title}</span>
              )}
              <span className="toc-disclosure" aria-hidden="true">⌄</span>
            </summary>
            {chapter.sections.length > 0 && (
              <div className="toc-section-list">
                {chapter.sections.map((section) => (
                  <Link
                    aria-current={section.href === currentHref ? "page" : undefined}
                    className={section.href === currentHref ? "current-chapter" : ""}
                    href={sitePath(section.href)}
                    key={section.id}
                  >
                    {section.title}
                  </Link>
                ))}
              </div>
            )}
          </details>
        );
      })}
    </nav>
  );
}
