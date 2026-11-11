# Morrow — Landing page and animated stories

A standalone collection of everything created for this project: the original interactive 3D landing page, both voxel story videos, the separate 2D pixel-art page and video, procedural rendering scripts, and detailed documentation.

## Included pages

| URL | Content |
| --- | --- |
| `/` | Original Morrow landing page, live Three.js characters, workspace, gallery, companions, and footer |
| `/stories/` | Gallery linking every video version |
| `/voxel-story/` | Front-facing 3D voxel walk, rain, and umbrella story |
| `/voxel-original/` | Original isometric 3D courtyard version |
| `/pixel-story/` | Separate 2D pixel-art page and story |
| `/fashion-demo/` | Interactive personal-stylist demo and 30-second portrait film |

The existing 3D landing-page source and rendered 3D videos were preserved. No Berd/Tauri desktop backend is required to run this standalone project.

## Run locally

Use Node.js 22 and npm:

```sh
npm ci
npm run dev
```

The landing page is at http://127.0.0.1:5180/. To run the independent 2D page, use `npm run dev:pixel` and open http://127.0.0.1:5182/.

To preview **all pages together**, build once and start the production preview:

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:5183/ and http://127.0.0.1:5183/stories/.

## Host on Vercel

1. Import `divinedona/3D` in Vercel.
2. Leave Root Directory at the repository root.
3. Select **Other** as the Framework Preset if Vercel asks.
4. Use Build Command `npm run build` and Output Directory `dist`.
5. Deploy. `vercel.json` already supplies these settings and uses trailing-slash page URLs.

The build combines the landing page, gallery, both 3D player pages, 2D page, fonts, and all playback assets into one static output. Video files are served directly; no API keys, environment variables, database, Python runtime, or video re-rendering are needed on Vercel.

## Source and documentation

- `morrow-site/`: original landing-page source.
- `morrow-site/BUILD_GUIDE.md`: detailed section-by-section implementation guide. Its earlier Berd setup/validation notes describe the original workspace; use this README for this standalone repository's setup.
- `morrow-site/video/`: 3D renderer, documentation, and both preserved videos under `output/`.
- `morrow-site/pixel-story/`: independent 2D page, pixel renderer, and video/poster/storyboard under `public/media/`.
- `pages/`: static story gallery and 3D player pages.
- `morrow-site/fashion-demo/`: personal-stylist prototype, its independent motion timeline, wardrobe imagery, and 1080 × 1920 film. See its README for rendering and interaction details.
- `scripts/build.mjs`: builds both apps and assembles the complete static site.
- `src/app/assets/fonts/`: the three local font files and their OFL license notices.

The existing 3D videos are at `morrow-site/video/output/a-little-rain-voxel-story.mp4` and `morrow-site/video/output/front-walk/a-little-rain-front-walk.mp4`. The 2D video is at `morrow-site/pixel-story/public/media/a-little-rain-2d-pixel.mp4`.

## Optional video re-rendering

The MP4 files are included; rendering is only needed when editing the story. Install Python with NumPy/Pillow and the encoder:

```sh
python -m pip install numpy pillow
python -m pip install --target .scratch/video-tools imageio-ffmpeg
npm run render:3d
npm run render:2d
```

Both are 15-second, 1080 × 1080, 24 fps H.264/AAC clips with original synthesized sound. The pixel art uses a 270 × 270 logical grid with nearest-neighbor scaling. The voxel animation uses articulated 3D cube meshes and perspective projection. No third-party footage or music was used.

## Checks

```sh
npm run check
npm run build
npm run verify:build
```

The landing-page workspace is a local interactive demo; ideas live in React memory for the current visit. The character models and page effects are original code. Font redistribution is covered by the included OFL notices. The fictional wordmark's decorative registration symbol is not a claim that Morrow is a registered trademark.
