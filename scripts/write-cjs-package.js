import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join("build", "cjs");

mkdirSync(outDir, { recursive: true });

writeFileSync(join(outDir, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2), "utf8");
