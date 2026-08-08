const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";

export const siteBasePath = configuredBasePath === "/"
  ? ""
  : configuredBasePath.replace(/\/$/, "");

export function sitePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return path;

  const hashIndex = path.indexOf("#");
  const pathname = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const looksLikeFile = /\/[^/]+\.[a-z0-9]+$/i.test(pathname);
  const normalizedPath = pathname !== "/" && !pathname.endsWith("/") && !looksLikeFile
    ? `${pathname}/`
    : pathname;

  return `${siteBasePath}${normalizedPath}${hash}`;
}
