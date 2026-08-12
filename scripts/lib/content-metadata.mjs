const contentDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function unquote(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];
  return quote && quote === trimmed.at(-1) && (quote === '"' || quote === "'")
    ? trimmed.slice(1, -1)
    : trimmed;
}

export function parseContentDocument(source, path = "Markdown document") {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return { content: source, metadata: {} };

  const metadata = {};
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/);
    if (!field || !field[2]) continue;
    metadata[field[1]] = unquote(field[2]);
  }

  for (const field of ["published", "updated"]) {
    if (metadata[field] && !contentDatePattern.test(metadata[field])) {
      throw new Error(`${path}: ${field} must use YYYY-MM-DD`);
    }
  }

  return {
    content: source.slice(frontmatter[0].length),
    metadata,
  };
}

export function effectiveContentDates(metadata = {}, fallback = {}) {
  const published = metadata.published || fallback.published;
  const updated = metadata.updated || fallback.updated || published;
  return { published, updated };
}
