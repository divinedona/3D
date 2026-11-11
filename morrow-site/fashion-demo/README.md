# Morrow Studio — Personal stylist concept

Open `/fashion-demo/` on the deployed site. Locally, `npm run dev:fashion` serves this page at `http://127.0.0.1:5185/`.

This independent page follows the supplied fashion-assistant reference: a sunrise lock screen, stylist chat, a complete leopard outfit, outfit details, closet selection, wearing confirmation, and a brand finish. The previous landing page, 3D clips, and 2D story remain intact.

## What works

- Chat with Noor: send a message and receive a scripted reply, including casual, work, and rainy-weather suggestions.
- Open the outfit, mark it worn, save it, and find it in the lookbook.
- Search eight wardrobe pieces, filter by category, toggle selections, and ask Noor about the selected pieces.
- Change the occasion in the profile.
- Play, pause, restart, or jump between the walkthrough scenes.
- Play or download the pre-rendered 30-second portrait MP4, with scene captions and original synthesized audio.

This is a local interactive prototype. Replies are scripted and choices last for the current visit. It does not connect to a model, fetch real weather, generate virtual try-ons, or store wardrobe accounts.

## Visuals and motion

React renders working phone screens. CSS creates the metallic phone edge, screen glass, dynamic island, sunset wallpaper, dock, depth, and shadows. `story.mjs` defines the 30-second timeline. A deterministic film view at `?film=1` lets the renderer capture the same screens at exact time values. This route uses CSS perspective; it does not require Three.js.

The outfit and garment photographs are cropped from the user-provided `WhatsApp Video 2026-10-12 at 14.57.36.mp4` to match the reference. The original video, its text frames, branding, and soundtrack are not included. Layouts, interface elements, animation code, and film soundtrack were created for this demo. The local fonts use the included OFL notices.

## Video and QA

`public/media/morrow-studio-film.mp4` is H.264/AAC, 30 seconds, 1080 × 1920, and 24 fps. Vercel serves it directly; Vercel does not run a browser or FFmpeg during deployment.

To reproduce it locally:

1. Run `npm ci` and `npm run dev:fashion` in a terminal.
2. Use an installed Chrome/Edge browser, or run `npx playwright install chromium`.
3. Generate the sound: `python scripts/make-fashion-sound.py` (requires NumPy).
4. Set `FFMPEG_EXE` to an FFmpeg executable. Set `BROWSER_EXE` only if needed; Windows Chrome and Edge are found automatically.
5. Run `npm run render:fashion` in another terminal. It checks the interactions, captures 720 frames from the live demo, and writes the MP4 and poster.

`FASHION_URL` can override the local URL for checks or rendering. `npm run check:fashion` runs desktop/mobile browser checks without rendering. These verify wearing/saving an outfit, lookbook retrieval, search, empty search results, filtering, selection, chat replies, mobile overflow, and walkthrough pause. Captured review images stay in ignored `.scratch/fashion-qa/`.
