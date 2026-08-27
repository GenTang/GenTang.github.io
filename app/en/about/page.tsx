import type { Metadata } from "next";
import { AboutPage } from "@/app/components/AboutPage";
import { JsonLd } from "@/app/components/JsonLd";
import { getMarkdownContent } from "@/app/lib/content";
import { absoluteSiteUrl, createPageMetadata } from "@/app/lib/siteMetadata";

const source = getMarkdownContent("/content/en/about.md");

export const metadata: Metadata = createPageMetadata({
  title: "About Gen Tang",
  description: "Gen Tang is a data scientist and technical author focused on AI, big data, and LLM engineering. He wrote Mastering Data Science and Deconstructing Large Language Models.",
  path: "/en/about",
  alternatePath: "/zh/about",
  locale: "en_US",
  kind: "website",
  keywords: ["Gen Tang", "data scientist", "artificial intelligence", "big data", "large language models"],
  imagePath: "/images/gen-tang.png",
  imageAlt: "Gen Tang",
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${absoluteSiteUrl("/en/about")}#profile`,
  url: absoluteSiteUrl("/en/about"),
  name: "About Gen Tang",
  description: "Gen Tang is a data scientist and technical author focused on AI, big data, and LLM engineering.",
  inLanguage: "en",
  mainEntity: {
    "@type": "Person",
    "@id": `${absoluteSiteUrl("/en/about")}#person`,
    name: "Gen Tang",
    alternateName: "唐亘",
    url: absoluteSiteUrl("/en/about"),
    image: absoluteSiteUrl("/images/gen-tang.png"),
    jobTitle: "Data Scientist",
    sameAs: ["https://github.com/GenTang"],
    knowsAbout: ["artificial intelligence", "large language models", "data science", "big data", "LLM engineering"],
  },
};

export default function About() {
  return (
    <>
      <JsonLd data={structuredData} />
      <AboutPage lang="en" source={source} />
    </>
  );
}
