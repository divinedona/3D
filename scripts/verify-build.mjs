import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const missing = [];
let references = 0;

async function check(url, relativeFile) {
  if (/^(?:https?:|data:|mailto:|#)/.test(url)) return;
  const base = new URL(
    relativeFile.replaceAll("\\", "/"),
    "https://morrow.invalid/",
  );
  const path = new URL(url, base).pathname;
  const local = join(
    root,
    decodeURIComponent(path),
    path.endsWith("/") ? "index.html" : "",
  );
  references += 1;
  try {
    await access(local);
  } catch {
    missing.push(`${relativeFile}: ${url}`);
  }
}

async function walk(directory, relative = "") {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    const relativeFile = join(relative, item.name);
    if (item.isDirectory()) {
      await walk(path, relativeFile);
    } else if (item.name.endsWith(".html")) {
      const content = await readFile(path, "utf8");
      for (const match of content.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
        await check(match[1], relativeFile);
      }
    } else if (item.name.endsWith(".css")) {
      const content = await readFile(path, "utf8");
      for (const match of content.matchAll(/url\(["']?([^\)"']+)["']?\)/g)) {
        await check(match[1], relativeFile);
      }
    }
  }
}

for (const page of [
  "index.html",
  "stories/index.html",
  "pixel-story/index.html",
  "voxel-story/index.html",
  "voxel-original/index.html",
]) {
  await access(join(root, page));
}
await walk(root);
if (missing.length)
  throw new Error(`Missing built assets or links:\n${missing.join("\n")}`);
console.log(
  `Verified all five pages and ${references} local asset/link references.`,
);
