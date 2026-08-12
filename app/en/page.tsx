import type { Metadata } from "next";
import { HomeView } from "../components/HomeView";
import {
  absoluteSiteUrl,
  createPageMetadata,
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
  name: "Xiaopang Notes",
  alternateName: "小胖笔记",
  url: absoluteSiteUrl("/en/"),
  description: englishSiteDescription,
  inLanguage: "en",
};

export default function EnglishHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeView lang="en" />
    </>
  );
}
