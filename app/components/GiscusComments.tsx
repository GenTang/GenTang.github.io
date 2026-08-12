"use client";

import { useEffect, useRef } from "react";

const repository = "GenTang/GenTang.github.io";
const repositoryId = "R_kgDOTyPYtg";
const defaultCategory = "Announcements";
const defaultCategoryId = "DIC_kwDOTyPYts4DDMt3";

export function GiscusComments({ lang }: { lang: "zh" | "en" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY?.trim() || defaultCategory;
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID?.trim() || defaultCategoryId;
  const isZh = lang === "zh";

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.replaceChildren();
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repository);
    script.setAttribute("data-repo-id", repositoryId);
    script.setAttribute("data-category", category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "0");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    script.setAttribute("data-lang", isZh ? "zh-CN" : "en");
    script.setAttribute("data-loading", "lazy");
    container.append(script);

    return () => container.replaceChildren();
  }, [category, categoryId, isZh]);

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <header>
        <h2 id="comments-title">{isZh ? "评论与讨论" : "Comments and discussion"}</h2>
      </header>
      <div className="giscus" ref={containerRef} />
    </section>
  );
}
