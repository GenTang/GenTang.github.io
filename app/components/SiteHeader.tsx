"use client";

import { useEffect, useState } from "react";
import { sitePath } from "@/app/lib/sitePath";

type SiteHeaderProps = {
  lang: "zh" | "en";
  active?: "home" | "book" | "blog";
  languageHref: string;
};

export function SiteHeader({ lang, active = "home", languageHref }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const prefix = lang === "en" ? "/en" : "";
  const bookHref = lang === "zh"
    ? "/books/deconstructing_LLM"
    : "/en/books/deconstructing_LLM/chapter-1";
  const labels = lang === "zh"
    ? { home: "首页", book: "书籍", blog: "博客", about: "关于", lang: "EN", theme: "切换深色模式", menu: "打开导航" }
    : { home: "Home", book: "Book", blog: "AI Essays", about: "About", lang: "中文", theme: "Toggle dark mode", menu: "Open navigation" };

  useEffect(() => {
    const saved = window.localStorage.getItem("xp-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = saved ? saved === "dark" : prefersDark;
    document.documentElement.dataset.theme = shouldUseDark ? "dark" : "light";
    const frame = window.requestAnimationFrame(() => setDark(shouldUseDark));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.localStorage.setItem("xp-theme", next ? "dark" : "light");
  };

  return (
    <>
      <div className="site-note-bar">
        <span>{lang === "zh" ? "长期写作 · 持续更新" : "Long-form notes · Updated continuously"}</span>
      </div>
      <header className="site-header">
        <a className="site-brand" href={sitePath(`${prefix}/`)} aria-label={lang === "zh" ? "小胖笔记首页" : "Xiaopang Notes home"}>
          <span className="brand-mark">胖</span>
          <span className="brand-copy">
            <strong>小胖笔记</strong>
            <small>XIAOPANG NOTES</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label={lang === "zh" ? "主导航" : "Main navigation"}>
          <a className={active === "home" ? "is-active" : ""} href={sitePath(`${prefix}/`)}>{labels.home}</a>
          <a className={active === "blog" ? "is-active" : ""} href={sitePath(`${prefix}/blog/ai-as-collaborator`)}>{labels.blog}</a>
          <a className={active === "book" ? "is-active" : ""} href={sitePath(bookHref)}>{labels.book}</a>
          <a href={sitePath(`${prefix}/#about`)}>{labels.about}</a>
        </nav>

        <div className="header-actions">
          <a className="round-action language-action" href={sitePath(languageHref)} aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}>{labels.lang}</a>
          <button className="round-action" type="button" onClick={toggleTheme} aria-label={labels.theme}>{dark ? "☀" : "☾"}</button>
          <button
            className="round-action mobile-menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-label={labels.menu}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="mobile-nav" aria-label={lang === "zh" ? "移动导航" : "Mobile navigation"}>
          <a href={sitePath(`${prefix}/`)}>{labels.home}</a>
          <a href={sitePath(`${prefix}/blog/ai-as-collaborator`)}>{labels.blog}</a>
          <a href={sitePath(bookHref)}>{labels.book}</a>
          <a href={sitePath(`${prefix}/#about`)}>{labels.about}</a>
        </nav>
      )}
    </>
  );
}
