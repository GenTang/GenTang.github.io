/* eslint-disable @next/next/no-img-element -- Markdown authors control local image paths and responsive widths. */
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { sitePath } from "@/app/lib/sitePath";

type MarkdownContentProps = {
  lang?: "zh" | "en";
  source: string;
  images?: Record<string, string>;
};

type MarkdownNode = {
  type: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  data?: {
    hProperties?: Record<string, unknown>;
  };
};

type HtmlNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HtmlNode[];
};

function nodeText(node: MarkdownNode): string {
  if (typeof node.value === "string") return node.value;
  return node.children?.map(nodeText).join("") ?? "";
}

function referenceId(value: string) {
  return value
    .trim()
    .replaceAll(".", "-")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
}

function referenceAnchors() {
  return (tree: MarkdownNode) => {
    const equations = new Set<string>();

    const collectAnchors = (node: MarkdownNode) => {
      if (node.type === "math" && node.value) {
        const label = node.value.match(/\\tag\{([^{}]+)\}/)?.[1];
        if (label) {
          const id = referenceId(label);
          equations.add(id);
          node.data ??= {};
          node.data.hProperties = { ...node.data.hProperties, id: `eq-${id}` };
        }
      }

      if (node.type === "heading") {
        const headingText = nodeText(node);

        if (/^(?:程序清单|Listing)(?:\s|\d)/iu.test(headingText)) {
          node.data ??= {};
          node.data.hProperties = {
            ...node.data.hProperties,
            className: ["code-listing-title"],
          };
        }

        const label = headingText.match(/^(\d+(?:\.\d+)+)\b/)?.[1];
        if (label) {
          const id = referenceId(label);
          node.data ??= {};
          node.data.hProperties = { ...node.data.hProperties, id: `section-${id}` };
        }
      }

      node.children?.forEach(collectAnchors);
    };

    const referencePattern = /公式[（(]\d+(?:[-.]\d+)+[）)]|\b(?:Equations?|Eqs?\.)\s*\(\d+(?:[-.]\d+)+\)(?:\s*(?:,\s*(?:(?:and|or)\s+)?|(?:and|or)\s+)\(\d+(?:[-.]\d+)+\))*/gi;
    const referenceLabelPattern = /[（(](\d+(?:[-.]\d+)+)[）)]/g;
    const skippedParents = new Set([
      "code",
      "definition",
      "heading",
      "html",
      "inlineCode",
      "inlineMath",
      "link",
      "linkReference",
      "math",
    ]);

    const linkReferences = (node: MarkdownNode) => {
      if (!node.children || skippedParents.has(node.type)) return;

      node.children = node.children.flatMap((child) => {
        if (child.type !== "text" || !child.value) {
          linkReferences(child);
          return [child];
        }

        const replacements: MarkdownNode[] = [];
        let cursor = 0;

        for (const match of child.value.matchAll(referencePattern)) {
          const start = match.index ?? 0;
          const linkedNodes: MarkdownNode[] = [];
          let matchCursor = 0;
          let hasTarget = false;
          let firstLabel = true;

          for (const labelMatch of match[0].matchAll(referenceLabelPattern)) {
            const labelStart = labelMatch.index ?? 0;
            const linkStart = firstLabel ? 0 : labelStart;
            const linkEnd = labelStart + labelMatch[0].length;
            const formulaId = labelMatch[1] ? referenceId(labelMatch[1]) : undefined;
            const target = formulaId && equations.has(formulaId)
              ? `#eq-${formulaId}`
              : undefined;

            if (linkStart > matchCursor) {
              linkedNodes.push({ type: "text", value: match[0].slice(matchCursor, linkStart) });
            }

            const referenceText = match[0].slice(linkStart, linkEnd);
            linkedNodes.push(target
              ? {
                  type: "link",
                  url: target,
                  children: [{ type: "text", value: referenceText }],
                }
              : { type: "text", value: referenceText });
            hasTarget ||= Boolean(target);
            matchCursor = linkEnd;
            firstLabel = false;
          }

          if (!hasTarget) continue;
          if (start > cursor) {
            replacements.push({ type: "text", value: child.value.slice(cursor, start) });
          }
          if (matchCursor < match[0].length) {
            linkedNodes.push({ type: "text", value: match[0].slice(matchCursor) });
          }
          replacements.push(...linkedNodes);
          cursor = start + match[0].length;
        }

        if (cursor === 0) return [child];
        if (cursor < child.value.length) {
          replacements.push({ type: "text", value: child.value.slice(cursor) });
        }
        return replacements;
      });
    };

    collectAnchors(tree);
    linkReferences(tree);
  };
}

function htmlNodeText(node: HtmlNode): string {
  if (typeof node.value === "string") return node.value;
  return node.children?.map(htmlNodeText).join("") ?? "";
}

function hasClass(node: HtmlNode, className: string) {
  const value = node.properties?.className;
  return Array.isArray(value) && value.includes(className);
}

function findDescendant(node: HtmlNode, predicate: (candidate: HtmlNode) => boolean): HtmlNode | undefined {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const match = findDescendant(child, predicate);
    if (match) return match;
  }
}

function katexEquationAnchors() {
  return (tree: HtmlNode) => {
    const addEquationId = (node: HtmlNode) => {
      if (node.type === "element" && hasClass(node, "katex-display")) {
        const tag = findDescendant(
          node,
          (candidate) => hasClass(candidate, "tag") || hasClass(candidate, "katex-tag"),
        );
        const label = tag ? htmlNodeText(tag).match(/^\((.+)\)$/)?.[1] : undefined;
        if (label) {
          node.properties = { ...node.properties, id: `eq-${referenceId(label)}` };
        }
      }

      node.children?.forEach(addEquationId);
    };

    addEquationId(tree);
  };
}

function splitHtmlChildrenIntoLines(children: HtmlNode[]): HtmlNode[][] {
  const lines: HtmlNode[][] = [[]];

  for (const child of children) {
    const childLines = splitHtmlNodeIntoLines(child);
    lines.at(-1)?.push(...childLines[0]);

    for (const childLine of childLines.slice(1)) {
      lines.push([...childLine]);
    }
  }

  return lines;
}

function splitHtmlNodeIntoLines(node: HtmlNode): HtmlNode[][] {
  if (node.type === "text") {
    return (node.value ?? "").split("\n").map((value) => (
      value ? [{ ...node, value }] : []
    ));
  }

  if (!node.children) return [[{ ...node }]];

  return splitHtmlChildrenIntoLines(node.children).map((children) => (
    children.length ? [{ ...node, children }] : []
  ));
}

function codeLineNumbers() {
  return (tree: HtmlNode) => {
    const addLineNumbers = (node: HtmlNode) => {
      if (node.type === "element" && node.tagName === "pre") {
        const code = node.children?.find(
          (child) => child.type === "element" && child.tagName === "code",
        );

        if (code) {
          const lines = splitHtmlChildrenIntoLines(code.children ?? []);
          if (lines.length > 1 && lines.at(-1)?.length === 0) lines.pop();

          code.children = lines.map((children, index) => ({
            type: "element",
            tagName: "span",
            properties: {
              className: ["code-line"],
              dataLineNumber: String(index + 1),
            },
            children: children.length ? children : [{ type: "text", value: " " }],
          }));
        }
      }

      node.children?.forEach(addLineNumbers);
    };

    addLineNumbers(tree);
  };
}

function imagePresentation(alt = "") {
  const sizeMatch = alt.match(/\s*\|\s*(\d+(?:\.\d+)?)(%|px)\s*$/i);

  return {
    caption: sizeMatch ? alt.slice(0, sizeMatch.index).trim() : alt.trim(),
    width: sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : undefined,
  };
}

function localizedContentHref(href: string | undefined, lang: "zh" | "en") {
  if (!href?.startsWith("/")) return href;
  if (/^\/(?:zh|en)(?:\/|$)/.test(href)) return href;
  if (/^\/(?:books|blog)(?:\/|$)/.test(href)) return `/${lang}${href}`;

  return href;
}

export function MarkdownContent({ lang = "zh", source, images }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, referenceAnchors]}
        remarkRehypeOptions={{
          footnoteLabel: lang === "en" ? "Footnotes" : "注释",
          footnoteBackLabel: lang === "en" ? "Back to content" : "返回正文",
          footnoteLabelProperties: { className: ["footnote-label"] },
        }}
        rehypePlugins={[rehypeSlug, rehypeKatex, katexEquationAnchors, rehypeHighlight, codeLineNumbers]}
        components={{
          a: ({ href, children, node, ...props }) => {
            void node;
            const localizedHref = localizedContentHref(href, lang);
            return (
              <a href={localizedHref?.startsWith("/") ? sitePath(localizedHref) : localizedHref} {...props}>
                {children}
              </a>
            );
          },
          p: ({ node, children, ...props }) => {
            const onlyChild = node?.children.length === 1 ? node.children[0] : undefined;
            const imageNode = onlyChild?.type === "element" && onlyChild.tagName === "img"
              ? onlyChild
              : undefined;
            const paragraphText = node ? htmlNodeText(node as HtmlNode).trim() : "";

            if (imageNode) {
              const rawAlt = typeof imageNode.properties.alt === "string" ? imageNode.properties.alt : "";
              const { caption } = imagePresentation(rawAlt);

              return (
                <figure className="markdown-figure">
                  {children}
                  {caption && <figcaption>{caption}</figcaption>}
                </figure>
              );
            }

            if (/^(?:表|Table)\s*\d+(?:[-.]\d+)*(?:\s+.+)?$/u.test(paragraphText)) {
              return <p className="table-title" {...props}>{children}</p>;
            }

            return <p {...props}>{children}</p>;
          },
          img: ({ src, alt, title }) => {
            const stringSrc = typeof src === "string" ? src : undefined;
            const normalizedSrc = stringSrc?.startsWith("images/") ? `./${stringSrc}` : stringSrc;
            const resolvedSrc = normalizedSrc ? images?.[normalizedSrc] ?? normalizedSrc : undefined;
            const { caption, width } = imagePresentation(alt ?? "");
            return (
              <img
                src={resolvedSrc}
                alt={caption}
                title={title}
                loading="lazy"
                decoding="async"
                style={width ? { width, maxWidth: "100%" } : undefined}
              />
            );
          },
          table: ({ node, children, ...props }) => {
            void node;
            return (
              <div
                className="markdown-table-scroll"
                role="region"
                aria-label={lang === "en" ? "Horizontally scrollable table" : "可横向滚动的表格"}
              >
                <table {...props}>{children}</table>
              </div>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
