import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist-electron");

await mkdir(outDir, { recursive: true });

for (const fileName of ["main.cjs", "preload.cjs", "logger.cjs"]) {
  await copyFile(path.join(root, "electron", fileName), path.join(outDir, fileName));
}
