const { chromium } = require("@playwright/test");
const { mkdir, writeFile } = require("node:fs/promises");
const { resolve, join } = require("node:path");
const { existsSync } = require("node:fs");

async function main() {
  const root = resolve(__dirname, "..");
  const out = join(root, "morrow-site/fashion-demo/public/media/atelier");
  await mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.BROWSER_EXE ||
      [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      ].find(existsSync),
    args: ["--enable-unsafe-swiftshader", "--disable-background-networking"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 800, height: 1100 },
    });
    await page.goto("http://127.0.0.1:5185/asset-studio.html", {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(() => typeof window.renderAsset === "function");
    for (const name of [
      "look",
      "jacket",
      "knit",
      "trousers",
      "jeans",
      "sneakers",
      "loafers",
      "tote",
      "sunglasses",
    ]) {
      const clip = await page.evaluate((id) => window.renderAsset(id), name);
      await page.screenshot({ path: join(out, `${name}.png`), clip });
      console.log(`Created original render: ${name}`);
    }
    await writeFile(
      join(out, "provenance.json"),
      JSON.stringify(
        {
          method:
            "Original Three.js geometry, procedural textile textures, and studio lighting",
          source: "asset-studio.mjs",
          externalPhotographs: 0,
          referenceVideoCrops: 0,
          assets: 9,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
