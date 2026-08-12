"use client";

import { useEffect, useMemo, useState } from "react";
import { sitePath } from "@/app/lib/sitePath";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type SearchEntry = {
  lang: "zh" | "en";
  url: string;
  kind: string;
  title: string;
  text: string;
};

type RankedEntry = SearchEntry & {
  score: number;
  snippet: string;
};

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase();
}

function queryTerms(query: string) {
  const normalized = normalize(query).trim();
  if (!normalized) return [];

  const terms = normalized.match(/[\p{Script=Han}]+|[\p{L}\p{N}][\p{L}\p{N}+#._-]*/gu) ?? [];
  return [...new Set(terms.filter(Boolean))];
}

function resultSnippet(text: string, terms: string[], lang: "zh" | "en") {
  const normalizedText = normalize(text);
  const positions = terms
    .map((term) => normalizedText.indexOf(term))
    .filter((position) => position >= 0);
  const firstMatch = positions.length ? Math.min(...positions) : 0;
  const radius = lang === "zh" ? 72 : 118;
  const start = Math.max(0, firstMatch - Math.floor(radius / 3));
  const end = Math.min(text.length, start + radius);

  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

function rankEntries(entries: SearchEntry[], query: string, lang: "zh" | "en"): RankedEntry[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  return entries
    .filter((entry) => entry.lang === lang)
    .map((entry) => {
      const title = normalize(entry.title);
      const body = normalize(entry.text);
      if (!terms.every((term) => title.includes(term) || body.includes(term))) {
        return { ...entry, score: 0, snippet: "" };
      }
      const score = terms.reduce((total, term) => {
        const titleMatches = title.split(term).length - 1;
        const bodyMatches = Math.min(body.split(term).length - 1, 12);
        return total + titleMatches * 24 + bodyMatches * 2;
      }, 0);

      return { ...entry, score, snippet: resultSnippet(entry.text, terms, lang) };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, lang === "zh" ? "zh-CN" : "en"))
    .slice(0, 50);
}

export function SearchPage({ lang }: { lang: "zh" | "en" }) {
  const isZh = lang === "zh";
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const results = useMemo(() => rankEntries(entries, query, lang), [entries, lang, query]);

  useEffect(() => {
    const controller = new AbortController();

    fetch(sitePath("/generated/search-index.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Search index request failed: ${response.status}`);
        return response.json() as Promise<SearchEntry[]>;
      })
      .then((data) => {
        setEntries(data);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  const hasQuery = query.trim().length > 0;

  return (
    <div className="site-shell search-shell">
      <SiteHeader lang={lang} active="search" languageHref={isZh ? "/en/search" : "/zh/search"} />
      <main className="search-main">
        <header className="search-heading">
          <span>SEARCH / INDEX</span>
          <h1>{isZh ? "搜索小胖笔记" : "Search Xiaopang Notes"}</h1>
          <p>{isZh
            ? "搜索书稿、章节、公式上下文与已发布博客。结果只来自当前语言版本。"
            : "Search the book, chapters, formula context, and published essays. Results stay within the current language."}</p>
        </header>

        <div className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isZh ? "例如：注意力机制、PPO、线性回归" : "Try: attention, PPO, linear regression"}
            aria-label={isZh ? "搜索站内内容" : "Search site content"}
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label={isZh ? "清空搜索" : "Clear search"}>×</button>}
        </div>

        <section className="search-results" aria-live="polite">
          {status === "loading" && <p className="search-state">{isZh ? "正在载入搜索索引……" : "Loading search index…"}</p>}
          {status === "error" && <p className="search-state is-error">{isZh
            ? "搜索索引暂时无法载入。开发模式下请先保存一次 content 文件，或运行本地发布检查。"
            : "The search index could not be loaded. In development, save a content file once or run the local publish check."}</p>}
          {status === "ready" && !hasQuery && <p className="search-state">{isZh
            ? `已索引 ${entries.filter((entry) => entry.lang === lang).length} 个页面，请输入关键词。`
            : `${entries.filter((entry) => entry.lang === lang).length} pages indexed. Enter a search term.`}</p>}
          {status === "ready" && hasQuery && results.length === 0 && <p className="search-state">{isZh
            ? "没有找到匹配内容，可以尝试更短或更具体的关键词。"
            : "No matching content. Try a shorter or more specific term."}</p>}
          {status === "ready" && results.length > 0 && (
            <>
              <p className="search-summary">{isZh ? `找到 ${results.length} 个结果` : `${results.length} results`}</p>
              <ol>
                {results.map((result) => (
                  <li key={result.url}>
                    <a href={sitePath(result.url)}>
                      <span>{result.kind}</span>
                      <h2>{result.title}</h2>
                      <p>{result.snippet}</p>
                      <b aria-hidden="true">→</b>
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
