const { chromium } = require("@playwright/test");
const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const { mkdir, writeFile } = require("node:fs/promises");
const { join, resolve } = require("node:path");
const assert = require("node:assert/strict");

const root = resolve(__dirname, "..");
const output = join(root, "morrow-site/fashion-demo/public/media");
const qa = join(root, ".scratch/fashion-qa");
const base = process.env.FASHION_URL || "http://127.0.0.1:5185/";
const executablePath =
  process.env.BROWSER_EXE ||
  [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find(existsSync);
const checkOnly = process.argv.includes("--check");

async function main() {
  await mkdir(output, { recursive: true });
  await mkdir(qa, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ["--disable-background-networking"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(qa, "desktop.png"), fullPage: true });
    await page
      .getByRole("button", { name: "Open outfit", exact: true })
      .click();
    await page.getByRole("button", { name: "Wear today", exact: true }).click();
    await page
      .getByRole("button", { name: "Wearing today", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Add to lookbook", exact: true })
      .click();
    await page.getByRole("button", { name: "Lookbook", exact: true }).click();
    await page.getByRole("button", { name: /Leopard Low-Rise/ }).waitFor();
    await page
      .getByRole("navigation", { name: "App navigation" })
      .getByRole("button", { name: "Closet", exact: true })
      .click();
    assert.equal(await page.locator(".closet-item").count(), 8);
    await page.getByLabel("Search your closet").fill("boots");
    assert.equal(await page.locator(".closet-item").count(), 1);
    await page
      .getByRole("button", { name: "Brown knee-high boots", exact: true })
      .click();
    assert.equal(
      await page
        .getByRole("button", { name: "Brown knee-high boots", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
    await page.getByLabel("Search your closet").fill("nothing-here");
    await page.getByText("No pieces found. Try another search.").waitFor();
    await page.getByLabel("Search your closet").fill("");
    await page.getByRole("button", { name: "Shoes", exact: true }).click();
    assert.equal(await page.locator(".closet-item").count(), 2);
    await page
      .getByRole("button", { name: "Chat with Noor", exact: true })
      .click();
    await page.getByLabel("Message Noor").fill("What if it rains tomorrow?");
    await page
      .getByRole("button", { name: "Send message", exact: true })
      .click();
    await page
      .getByText("For rain, keep the boots and add a light jacket.", {
        exact: false,
      })
      .waitFor();
    await page
      .getByRole("navigation", { name: "App navigation" })
      .getByRole("button", { name: "Closet", exact: true })
      .click();
    await page.screenshot({ path: join(qa, "closet.png"), fullPage: false });

    const mobile = await browser.newPage({
      viewport: { width: 360, height: 800 },
      isMobile: true,
      hasTouch: true,
    });
    mobile.on("pageerror", (error) => errors.push(error.message));
    await mobile.goto(base, { waitUntil: "networkidle" });
    await mobile.evaluate(() => document.fonts.ready);
    assert(
      await mobile.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      "Mobile page overflows horizontally",
    );
    await mobile
      .getByRole("button", { name: "Open outfit", exact: true })
      .click();
    await mobile
      .getByRole("button", { name: "Wear today", exact: true })
      .click();
    await mobile
      .getByRole("button", { name: "Wearing today", exact: true })
      .waitFor();
    await mobile.screenshot({ path: join(qa, "mobile.png"), fullPage: true });
    await mobile
      .getByRole("navigation", { name: "App navigation" })
      .getByRole("button", { name: "Closet", exact: true })
      .click();
    await mobile
      .getByRole("button", { name: "Watch the walkthrough", exact: false })
      .click();
    await mobile
      .getByRole("button", { name: "Unlock the stylist demo", exact: true })
      .waitFor();
    await mobile
      .getByRole("button", { name: "Pause walkthrough", exact: true })
      .click();
    const paused = await mobile.locator(".transport > span").textContent();
    await mobile.waitForTimeout(350);
    assert.equal(
      await mobile.locator(".transport > span").textContent(),
      paused,
    );
    assert.deepEqual(errors, [], "Browser runtime errors");
    await mobile.close();
    await page.close();
    console.log(
      "Passed desktop/mobile interaction checks: outfit, wear, save, lookbook, wardrobe, search, filters, chat, and pause.",
    );
    if (checkOnly) return;

    assert(process.env.FFMPEG_EXE, "Set FFMPEG_EXE to an FFmpeg executable.");
    assert(
      existsSync(join(output, "studio-sound.wav")),
      "Generate studio-sound.wav first.",
    );
    const film = await browser.newPage({
      viewport: { width: 540, height: 960 },
      deviceScaleFactor: 2,
    });
    await film.goto(`${base}?film=1`, { waitUntil: "networkidle" });
    await film.waitForFunction(
      () => typeof window.__setFilmTime === "function",
    );
    await film.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [
          "outfit",
          "top",
          "jeans",
          "boots",
          "skirt",
          "sneakers",
          "off-shoulder",
          "bag",
          "sunglasses",
        ].map(
          (name) =>
            new Promise((done, fail) => {
              const picture = new Image();
              picture.onload = done;
              picture.onerror = fail;
              picture.src = `./media/${name}.webp`;
            }),
        ),
      );
    });
    const video = join(output, "morrow-studio-film.mp4");
    const encoder = spawn(process.env.FFMPEG_EXE, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "image2pipe",
      "-framerate",
      "24",
      "-vcodec",
      "mjpeg",
      "-i",
      "pipe:0",
      "-i",
      join(output, "studio-sound.wav"),
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "19",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-t",
      "30",
      video,
    ]);
    let encoderError = "";
    encoder.stderr.on("data", (value) => {
      encoderError += value.toString();
    });
    const completion = new Promise((done, fail) => {
      encoder.on("error", fail);
      encoder.on("close", (code) =>
        code === 0
          ? done()
          : fail(new Error(encoderError || `Encoder exited ${code}`)),
      );
    });
    completion.catch(() => {});
    const keyFrames = new Set([36, 144, 252, 384, 492, 576, 648, 708]);
    for (let frame = 0; frame < 720; frame += 1) {
      await film.evaluate(
        (seconds) => window.__setFilmTime(seconds),
        frame / 24,
      );
      const buffer = await film.screenshot({ type: "jpeg", quality: 95 });
      await new Promise((done, fail) =>
        encoder.stdin.write(buffer, (error) => (error ? fail(error) : done())),
      );
      if (keyFrames.has(frame))
        await film.screenshot({
          path: join(qa, `film-${frame}.png`),
          type: "png",
        });
      if (frame === 252)
        await film.screenshot({
          path: join(output, "film-poster.jpg"),
          type: "jpeg",
          quality: 92,
        });
      if (frame % 48 === 0) console.log(`Rendering film: ${frame / 24}s / 30s`);
    }
    encoder.stdin.end();
    await completion;
    await film.close();
    await writeFile(
      join(output, "film-info.json"),
      JSON.stringify(
        {
          duration: 30,
          width: 1080,
          height: 1920,
          fps: 24,
          codec: "H.264/AAC",
          frames: 720,
          source: "Captured from the live demo",
          interactionChecks: "passed",
        },
        null,
        2,
      ),
    );
    console.log(`Film complete: ${video}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
