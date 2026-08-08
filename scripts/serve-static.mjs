import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve("out");
const port = Number(process.env.PORT ?? 3001);
const mimeTypes = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function existingFile(pathname) {
  const decoded = decodeURIComponent(pathname.split("?", 1)[0]);
  const relativePath = normalize(decoded).replace(/^[/\\]+/, "");
  const candidate = resolve(root, relativePath);
  if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return;

  for (const path of [candidate, join(candidate, "index.html"), `${candidate}.html`]) {
    try {
      if ((await stat(path)).isFile()) return path;
    } catch (error) {
      if (error?.code !== "ENOENT" && error?.code !== "ENOTDIR") throw error;
    }
  }
}

const server = createServer(async (request, response) => {
  try {
    const path = await existingFile(request.url ?? "/") ?? join(root, "404.html");
    const status = path.endsWith(`${sep}404.html`) ? 404 : 200;
    response.writeHead(status, {
      "Content-Type": mimeTypes[extname(path).toLowerCase()] ?? "application/octet-stream",
    });
    createReadStream(path).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(String(error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`静态预览：http://localhost:${port}`);
  console.log("按 Control + C 停止。\n");
});
