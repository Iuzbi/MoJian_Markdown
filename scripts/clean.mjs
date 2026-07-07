import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

for (const folder of ["dist", "dist-electron", "release"]) {
  await rm(path.join(root, folder), { recursive: true, force: true });
}
