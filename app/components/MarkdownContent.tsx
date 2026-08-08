/* eslint-disable @next/next/no-img-element -- Markdown authors control local image paths and responsive widths. */
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { sitePath } from "@/app/lib/sitePath";

type MarkdownContentProps = {
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
    const sections = new Set<string>();

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
        const label = nodeText(node).match(/^(\d+(?:\.\d+)+)\b/)?.[1];
        if (label) {
          const id = referenceId(label);
          sections.add(id);
          node.data ??= {};
          node.data.hProperties = { ...node.data.hProperties, id: `section-${id}` };
        }
      }

      node.children?.forEach(collectAnchors);
    };

    const referencePattern = /公式[（(](\d+(?:[-.]\d+)+)[）)]|(\d+(?:\.\d+)+)\s*节/g;
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
          const formulaId = match[1] ? referenceId(match[1]) : undefined;
          const sectionId = match[2] ? referenceId(match[2]) : undefined;
          const target = formulaId && equations.has(formulaId)
            ? `#eq-${formulaId}`
            : sectionId && sections.has(sectionId)
              ? `#section-${sectionId}`
              : undefined;

          if (!target) continue;
          if (start > cursor) {
            replacements.push({ type: "text", value: child.value.slice(cursor, start) });
          }
          replacements.push({
            type: "link",
            url: target,
            children: [{ type: "text", value: match[0] }],
          });
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

function imagePresentation(alt = "") {
  const sizeMatch = alt.match(/\s*\|\s*(\d+(?:\.\d+)?)(%|px)\s*$/i);

  return {
    caption: sizeMatch ? alt.slice(0, sizeMatch.index).trim() : alt.trim(),
    width: sizeMatch ? `${sizeMatch[1]}${sizeMatch[2].toLowerCase()}` : undefined,
  };
}

export function MarkdownContent({ source, images }: MarkdownContentProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, referenceAnchors]}
        remarkRehypeOptions={{
          footnoteLabel: "注释",
          footnoteBackLabel: "返回正文",
          footnoteLabelProperties: { className: ["footnote-label"] },
        }}
        rehypePlugins={[rehypeSlug, rehypeKatex, katexEquationAnchors, rehypeHighlight]}
        components={{
          a: ({ href, children, node, ...props }) => {
            void node;
            return <a href={href?.startsWith("/") ? sitePath(href) : href} {...props}>{children}</a>;
          },
          p: ({ node, children, ...props }) => {
            const onlyChild = node?.children.length === 1 ? node.children[0] : undefined;
            const imageNode = onlyChild?.type === "element" && onlyChild.tagName === "img"
              ? onlyChild
              : undefined;

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
                style={width ? { width, maxWidth: "100%" } : undefined}
              />
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
