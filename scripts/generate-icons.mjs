import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourceSvg = path.join(root, "build", "app-icon.svg");
const buildDir = path.join(root, "build");
const iconsDir = path.join(buildDir, "icons");
const publicDir = path.join(root, "public");
const pngSizes = [16, 24, 32, 48, 64, 128, 256, 512];

if (!existsSync(sourceSvg)) {
  throw new Error(`Missing icon source: ${sourceSvg}`);
}

await mkdir(iconsDir, { recursive: true });
await mkdir(publicDir, { recursive: true });

for (const size of pngSizes) {
  await renderSvgToPng(size, path.join(iconsDir, `icon-${size}.png`));
}

const icoSizes = pngSizes.filter((size) => size <= 256);
const iconBuffer = await pngToIco(icoSizes.map((size) => path.join(iconsDir, `icon-${size}.png`)));

await writeFile(path.join(buildDir, "icon.ico"), iconBuffer);
await writeFile(path.join(buildDir, "file-association.ico"), iconBuffer);
await writeFile(path.join(buildDir, "installer.ico"), iconBuffer);
await copyFile(path.join(iconsDir, "icon-512.png"), path.join(buildDir, "icon.png"));
await copyFile(path.join(iconsDir, "icon-512.png"), path.join(publicDir, "icon.png"));
await copyFile(sourceSvg, path.join(publicDir, "icon.svg"));

async function renderSvgToPng(size, outputFile) {
  const svg = await readFile(sourceSvg);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: "width",
      value: size
    }
  });
  const pngData = resvg.render();

  await writeFile(outputFile, pngData.asPng());
}
