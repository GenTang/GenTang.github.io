#!/usr/bin/env node

import { constants } from "node:fs";
import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  describeMediumSource,
  mediumSourceConfigValue,
  resolveMediumSources,
} from "./medium-import.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(projectRoot, "medium-import.json");
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://gentang.github.io/";

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
  console.log(`已登记 ${sourcePaths.length} 篇 Medium 临时页。提交并推送 medium-import.json，部署完成后访问：`);
  for (const sourcePath of sourcePaths) console.log(describeMediumSource(sourcePath, siteUrl).importUrl);
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
  const config = await readConfig();
  const sourcePaths = await resolveMediumSources(config.sources ?? []);
  console.log(`当前共 ${sourcePaths.length} 篇：`);
  for (const sourcePath of sourcePaths) {
    const descriptor = describeMediumSource(sourcePath, siteUrl);
    console.log(`${mediumSourceConfigValue(sourcePath)}\n  ${descriptor.importUrl}`);
  }
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
