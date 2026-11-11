import { cp, mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const vite = join(
  dirname(require.resolve("vite/package.json")),
  "bin",
  "vite.js",
);

for (const config of [
  "morrow-site/vite.config.mjs",
  "morrow-site/pixel-story/vite.config.mjs",
  "morrow-site/fashion-demo/vite.config.mjs",
]) {
  const result = spawnSync(
    process.execPath,
    [vite, "build", "--config", config],
    {
      cwd: root,
      stdio: "inherit",
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

// Remove only this project's generated root output, after checking its absolute path.
const output = resolve(root, "dist");
if (dirname(output) !== root || basename(output) !== "dist") {
  throw new Error("Unexpected build output path");
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(join(root, "morrow-site/dist"), output, { recursive: true });
await cp(
  join(root, "morrow-site/pixel-story/dist"),
  join(output, "pixel-story"),
  { recursive: true },
);
await cp(join(root, "pages"), output, { recursive: true });
await cp(
  join(root, "morrow-site/fashion-demo/dist"),
  join(output, "fashion-demo"),
  { recursive: true },
);

const media = join(output, "videos", "3d");
await mkdir(media, { recursive: true });
const originals = join(root, "morrow-site/video/output");
for (const [source, target] of [
  ["a-little-rain-voxel-story.mp4", "original.mp4"],
  ["verified-umbrella-frame.png", "original-poster.png"],
  ["front-walk/a-little-rain-front-walk.mp4", "front-walk.mp4"],
  ["front-walk/verified-front-walking-frame.png", "front-walk-poster.png"],
]) {
  await cp(join(originals, source), join(media, target));
}
await mkdir(join(output, "fonts"), { recursive: true });
for (const [source, target] of [
  ["Inter[opsz,wght].ttf", "Inter.ttf"],
  ["Fraunces-Italic[SOFT,WONK,opsz,wght].ttf", "FrauncesItalic.ttf"],
  ["GeistMono[wght].ttf", "GeistMono.ttf"],
  ["INTER_OFL.txt", "INTER_OFL.txt"],
  ["FRAUNCES_OFL.txt", "FRAUNCES_OFL.txt"],
  ["GEIST_MONO_OFL.txt", "GEIST_MONO_OFL.txt"],
]) {
  await cp(
    join(root, "src/app/assets/fonts", source),
    join(output, "fonts", target),
  );
}
console.log(
  "Built landing page, story gallery, 2D page, both 3D pages, and all video assets into dist.",
);
