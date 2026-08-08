import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateContent } from "./generate-content.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function runNode(args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: "inherit",
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else reject(new Error(signal ? `命令被 ${signal} 终止` : `命令退出，状态码 ${code}`));
    });
  });
}

function runScript(script, args = []) {
  return runNode([script, ...args]);
}

if (process.argv.includes("--lint")) {
  await generateContent();
  await runScript(resolve(projectRoot, "node_modules", "eslint", "bin", "eslint.js"), ["."]);
}

await generateContent();
await runScript(resolve(projectRoot, "node_modules", "next", "dist", "bin", "next"), ["build", "--webpack"]);
await writeFile(resolve(projectRoot, "out", ".nojekyll"), "", "utf8");
await runNode(["--test", "tests/static-export.test.mjs"]);
console.log("\n本地发布检查完成：out/ 已准备好，可继续提交和推送。\n");
