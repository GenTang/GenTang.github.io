#!/usr/bin/env node

import { constants } from "node:fs";
import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  mediumSourceConfigValue,
  resolveMediumSources,
} from "./medium-import.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(projectRoot, "medium-import.json");
const manifestPath = resolve(projectRoot, "out", "medium-import", "manifest.json");

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readConfig() {
  return JSON.parse(await readFile(configPath, "utf8"));
}

async function stage(args) {
  const normalizedArgs = args.filter((argument) => argument !== "--");
  const all = normalizedArgs.includes("--all");
  const selectors = normalizedArgs.filter((argument) => argument !== "--all");
  if (all && selectors.length > 0) throw new Error("--all 不能与文件或目录选择器同时使用");
  const sourcePaths = await resolveMediumSources(selectors, { all });
  const config = { sources: sourcePaths.map(mediumSourceConfigValue) };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  console.log(`已登记 ${sourcePaths.length} 篇 Medium 临时页。运行 publish 后，终端会打印本次构建的全新导入地址。`);
}

async function remove(args) {
  if (!(await exists(configPath))) {
    console.log("当前没有 Medium 临时页。");
    return;
  }
  const selectors = args.filter((argument) => argument !== "--");
  const config = await readConfig();
  const currentPaths = await resolveMediumSources(config.sources ?? []);
  const removedPaths = selectors.length > 0 ? await resolveMediumSources(selectors) : currentPaths;
  const removed = new Set(removedPaths.map(mediumSourceConfigValue));
  const remaining = currentPaths
    .map(mediumSourceConfigValue)
    .filter((source) => !removed.has(source));

  if (remaining.length > 0) {
    await writeFile(configPath, `${JSON.stringify({ sources: remaining }, null, 2)}\n`, "utf8");
  } else {
    await unlink(configPath);
  }
  console.log(`已删除 ${currentPaths.length - remaining.length} 篇临时页配置，剩余 ${remaining.length} 篇。`);
  console.log("提交并推送这次删除；GitHub Pages 重新部署后，临时 URL 将返回 404。");
}

async function status() {
  if (!(await exists(configPath))) {
    console.log("当前没有 Medium 临时页。");
    return;
  }
  if (!(await exists(manifestPath))) {
    console.log("尚未生成本次 Medium 临时页，请先运行 ./scripts/publish.sh。");
    return;
  }
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  console.log(`本次构建版本 ${manifest.importVersion}，共 ${manifest.pages?.length ?? 0} 篇：`);
  for (const page of manifest.pages ?? []) console.log(`${page.source}\n  ${page.importUrl}`);
}

const [command, ...args] = process.argv.slice(2);

try {
  if (command === "stage") await stage(args);
  else if (command === "remove") await remove(args);
  else if (command === "status") await status();
  else throw new Error("用法：pnpm medium:stage -- <文件或目录...> | pnpm medium:stage -- --all | pnpm medium:status | pnpm medium:remove [文件或目录...]");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
