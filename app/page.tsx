import type { Metadata } from "next";
import { createPageMetadata, siteDescription } from "./lib/siteMetadata";
import { sitePath } from "./lib/sitePath";

export const metadata: Metadata = createPageMetadata({
  title: "小胖笔记",
  description: siteDescription,
  path: "/zh/",
  alternatePath: "/en/",
  kind: "website",
  noIndex: true,
});

export default function LanguageEntry() {
  const target = sitePath("/zh/");

  return (
    <main className="root-language-entry">
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(target)});`,
        }}
      />
      <p>
        正在进入中文站点…… <a href={target}>继续访问</a>
      </p>
    </main>
  );
}
