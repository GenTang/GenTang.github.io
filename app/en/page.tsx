import type { Metadata } from "next";
import { HomeView } from "../components/HomeView";
import { JsonLd } from "../components/JsonLd";
import {
  absoluteSiteUrl,
  createPageMetadata,
  englishAuthorName,
  englishHomeTitle,
  englishSiteDescription,
} from "../lib/siteMetadata";

const generatedMetadata = createPageMetadata({
  title: englishHomeTitle,
  description: englishSiteDescription,
  path: "/en/",
  alternatePath: "/zh/",
  locale: "en_US",
  kind: "website",
  keywords: [
    "Xiaopang Notes",
    "LLM",
    "large language models",
    "model architectures",
    "data foundations",
    "engineering implementation",
    "artificial intelligence",
    "AI",
    "Deep Learning",
  ],
});

export const metadata: Metadata = {
  ...generatedMetadata,
  title: { absolute: englishHomeTitle },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${absoluteSiteUrl("/en/")}#website`,
  name: "Xiaopang Notes",
  alternateName: "小胖笔记",
  url: absoluteSiteUrl("/en/"),
  description: englishSiteDescription,
  inLanguage: "en",
  publisher: {
    "@type": "Person",
    "@id": `${absoluteSiteUrl("/en/about")}#person`,
    name: englishAuthorName,
    url: absoluteSiteUrl("/en/about"),
  },
};

export default function EnglishHome() {
  return (
    <>
      <JsonLd data={websiteStructuredData} />
      <HomeView lang="en" />
    </>
  );
}
