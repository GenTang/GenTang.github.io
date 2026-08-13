import { MarkdownContent } from "./MarkdownContent";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { sitePath } from "@/app/lib/sitePath";

type ContactItem = {
  label: string;
  title: string;
  description: string;
  href: string;
};

const contacts: Record<"zh" | "en", ContactItem[]> = {
  zh: [
    {
      label: "ISSUE",
      title: "勘误与问题反馈",
      description: "书稿错字、公式、链接、翻译、配套代码或网页问题，请提交 Issue，并附上页面地址。",
      href: "https://github.com/GenTang/GenTang.github.io/issues/new",
    },
    {
      label: "DISCUSSION",
      title: "交流与公开讨论",
      description: "想交流书中或博客里的观点、提出开放问题，或分享延伸思考，欢迎发起 Discussion。",
      href: "https://github.com/GenTang/GenTang.github.io/discussions",
    },
  ],
  en: [
    {
      label: "ISSUE",
      title: "Corrections and issue reports",
      description: "For typos, formulas, links, translations, companion code, or site issues, open an Issue with the page URL.",
      href: "https://github.com/GenTang/GenTang.github.io/issues/new",
    },
    {
      label: "DISCUSSION",
      title: "Questions and open discussion",
      description: "To discuss ideas from the book or blog, raise open questions, or share related thoughts, start a GitHub Discussion.",
      href: "https://github.com/GenTang/GenTang.github.io/discussions",
    },
  ],
};

export function AboutPage({ lang, source }: { lang: "zh" | "en"; source: string }) {
  const isZh = lang === "zh";

  return (
    <div className={`site-shell about-shell about-${lang}`}>
      <SiteHeader lang={lang} active="about" languageHref={isZh ? "/en/about" : "/zh/about"} />
      <main className="about-main">
        <section className="about-profile">
          <figure className="about-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element -- User-provided portrait is a public static asset. */}
            <img src={sitePath("/images/gen-tang.png")} alt={isZh ? "唐亘" : "Gen Tang"} />
          </figure>
          <article className="about-copy">
            <MarkdownContent lang={lang} source={source} />
          </article>
        </section>

        <section className="contact-section" id="contact">
          <header>
            <h2>{isZh ? "联系与反馈" : "Contact and feedback"}</h2>
          </header>
          <div className="contact-grid">
            <a className="contact-email" href="mailto:gen.tang86@gmail.com">
              <span>EMAIL</span>
              <h3>{isZh ? "邮件联系" : "Email me"}</h3>
              <p>{isZh
                ? "如果有问题或想直接交流，欢迎来信：gen.tang86@gmail.com"
                : "Questions and ideas are always welcome at gen.tang86@gmail.com."}</p>
              <b aria-hidden="true">↗</b>
            </a>
            {contacts[lang].map((item) => (
              <a href={item.href} key={item.label} target="_blank" rel="noreferrer">
                <span>{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <b aria-hidden="true">↗</b>
              </a>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
