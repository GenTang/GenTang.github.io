import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

await writeFile(resolve("out", ".nojekyll"), "", "utf8");
console.log("静态站点已生成到 out/。\n");
