import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { watchContent } from "./generate-content.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
const stopWatching = await watchContent();
const server = spawn(process.execPath, [nextBin, "dev", "--webpack"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env,
});

function stop(signal = "SIGTERM") {
  stopWatching();
  if (!server.killed) server.kill(signal);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
server.on("exit", (code, signal) => {
  stopWatching();
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
