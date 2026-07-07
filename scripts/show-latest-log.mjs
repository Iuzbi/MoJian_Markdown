import fs from "node:fs";
import path from "node:path";

const directory = path.join("E:\\Desktop", "MoJian_Debug_Logs");

if (!fs.existsSync(directory)) {
  console.log("NO_LOG_FOUND");
  process.exit(0);
}

const files = fs
  .readdirSync(directory)
  .map((name) => path.join(directory, name))
  .filter((entry) => fs.statSync(entry).isFile())
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

console.log(files[0] || "NO_LOG_FOUND");
