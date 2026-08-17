import enContent from "@/content/en/site.json";
import zhContent from "@/content/zh/site.json";
import { BlogStatus } from "./BlogStatus";
import { getBlogMarkdownMetadata } from "@/app/lib/content";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function BlogIndexPage({ lang }: { lang: "zh" | "en" }) {
  const content = lang === "en" ? enContent : zhContent;
  const dates = getBlogMarkdownMetadata(lang, content.essay.href);
  const essay = { ...content.essay, date: dates.published ?? content.essay.date };

  return (
    <div className="site-shell">
      <SiteHeader
        lang={lang}
        active="blog"
        languageHref={lang === "en" ? "/zh/blog" : "/en/blog"}
      />
      <main className="blog-index-main">
        <BlogStatus essay={essay} headingLevel="h1" />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
