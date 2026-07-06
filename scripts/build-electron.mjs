import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "dist-electron");

await mkdir(outDir, { recursive: true });
await copyFile(path.join(root, "electron", "main.cjs"), path.join(outDir, "main.cjs"));
await copyFile(path.join(root, "electron", "preload.cjs"), path.join(outDir, "preload.cjs"));
