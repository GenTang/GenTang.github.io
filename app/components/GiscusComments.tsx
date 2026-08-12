"use client";

import { useEffect, useRef, useState } from "react";

const repository = "GenTang/GenTang.github.io";
const repositoryId = "R_kgDOTyPYtg";

export function GiscusComments({ lang }: { lang: "zh" | "en" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadComments, setLoadComments] = useState(false);
  const category = process.env.NEXT_PUBLIC_GISCUS_CATEGORY?.trim();
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID?.trim();
  const configured = Boolean(category && categoryId);
  const isZh = lang === "zh";

  useEffect(() => {
    if (!loadComments || !configured || !containerRef.current) return;

    const container = containerRef.current;
    container.replaceChildren();
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repository);
    script.setAttribute("data-repo-id", repositoryId);
    script.setAttribute("data-category", category ?? "");
    script.setAttribute("data-category-id", categoryId ?? "");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "1");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    script.setAttribute("data-lang", isZh ? "zh-CN" : "en");
    script.setAttribute("data-loading", "lazy");
    container.append(script);

    return () => container.replaceChildren();
  }, [category, categoryId, configured, isZh, loadComments]);

  return (
    <section className="comments-section" aria-labelledby="comments-title">
      <header>
        <span>DISCUSSION</span>
        <h2 id="comments-title">{isZh ? "评论与讨论" : "Comments and discussion"}</h2>
        <p>{isZh
          ? "评论由 GitHub Discussions 提供。加载后，浏览器会连接到 giscus.app；发表内容需要登录 GitHub。"
          : "Comments are powered by GitHub Discussions. Loading connects your browser to giscus.app, and posting requires a GitHub account."}</p>
      </header>

      {configured ? (
        loadComments
          ? <div className="giscus" ref={containerRef} />
          : <button className="comments-load-button" type="button" onClick={() => setLoadComments(true)}>
              {isZh ? "加载评论" : "Load comments"}<span>→</span>
            </button>
      ) : (
        <div className="comments-setup-note">
          <strong>{isZh ? "评论功能待完成一次仓库授权" : "One repository authorization remains"}</strong>
          <p>{isZh
            ? "仓库已经开启 Discussions。请先安装 Giscus App；取得分类信息后，将分类名称与 ID 写入环境变量即可启用。"
            : "Discussions are enabled. Install the Giscus App first, then add the category name and ID to the environment variables."}</p>
          <a href="https://github.com/apps/giscus" target="_blank" rel="noreferrer">
            {isZh ? "安装 Giscus App" : "Install the Giscus App"}<span>↗</span>
          </a>
        </div>
      )}
    </section>
  );
}
