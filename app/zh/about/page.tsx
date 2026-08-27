import type { Metadata } from "next";
import { AboutPage } from "@/app/components/AboutPage";
import { JsonLd } from "@/app/components/JsonLd";
import { getMarkdownContent } from "@/app/lib/content";
import { absoluteSiteUrl, createPageMetadata } from "@/app/lib/siteMetadata";

const source = getMarkdownContent("/content/zh/about.md");

export const metadata: Metadata = createPageMetadata({
  title: "关于唐亘",
  description: "唐亘，数据科学家与技术作者，专注人工智能、大数据和 LLM 工程。著有《精通数据科学》与《解构大语言模型》，并曾担任 Packt 技术审稿人。",
  path: "/zh/about",
  alternatePath: "/en/about",
  kind: "website",
  keywords: ["唐亘", "数据科学家", "人工智能", "大数据", "解构大语言模型"],
  imagePath: "/images/gen-tang.png",
  imageAlt: "唐亘",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${absoluteSiteUrl("/zh/about")}#profile`,
  url: absoluteSiteUrl("/zh/about"),
  name: "关于唐亘",
  description: "唐亘，数据科学家与技术作者，专注人工智能、大数据和 LLM 工程。",
  inLanguage: "zh-CN",
  mainEntity: {
    "@type": "Person",
    "@id": `${absoluteSiteUrl("/zh/about")}#person`,
    name: "唐亘",
    alternateName: "Gen Tang",
    url: absoluteSiteUrl("/zh/about"),
    image: absoluteSiteUrl("/images/gen-tang.png"),
    jobTitle: "数据科学家",
    sameAs: ["https://github.com/GenTang"],
    knowsAbout: ["人工智能", "大语言模型", "数据科学", "大数据", "LLM 工程"],
  },
};

export default function About() {
  return (
    <>
      <JsonLd data={structuredData} />
      <AboutPage lang="zh" source={source} />
    </>
  );
}
