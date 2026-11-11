# Morrow Atelier — The Olive Edit

Open `/fashion-demo/` on your website, or `npm run dev:fashion` locally at http://127.0.0.1:5185/.

This original concept uses a new wardrobe, Mira's own styling conversation, a sage-and-cream palette, an animated phone, and a 30-second portrait film. The supplied video informed the presentation and pacing. No image crops, photographs, clothing graphics, audio, or branding from it are used by the new demo.

## Original visuals

`asset-studio.mjs` creates the clothing from Three.js geometry, procedural textile textures, original colours, and studio lights. The nine PNG renders in `public/media/atelier/` show the full sculptural outfit and eight garments/accessories. Their provenance is recorded in `provenance.json`.

Re-render with `node scripts/render-atelier-assets.cjs` while the fashion development server is running. An installed Chrome/Edge browser or Playwright Chromium is required.

## Motion and interactions

The phone camera follows continuous eased keyframes. Actual screen changes retain an outgoing view while the next view slides and fades in. Outfit reveal, typing dots, tap movement, press feedback, expanding tap rings, and garment checkmarks are animated. The same timeline drives the browser and captured film.

The timeline shows the morning chat, opens The Olive Edit, browses the wardrobe, selects the trousers and tote, opens the outfit again, confirms Wear today, and finishes in chat.

You can send a message to Mira, search/filter the wardrobe, select pieces, wear/save the edit, view your lookbook, and change the occasion. Replies are scripted and choices last for the current visit.

## Sound

Click **Play with sound** to start the walkthrough and its music. Browsers allow audible playback after this user gesture. **Sound on/off** controls live music and effects; pausing or leaving the tour pauses the music.

Real clicks use Web Audio for tap, selection, and confirmation tones. Timed tour taps play the same kinds of sound. `timeline.json` synchronizes visible taps and the exported soundtrack. `make-atelier-sound.py` synthesizes original music and sound effects; there is no reference-video audio.

## Film and checks

`public/media/atelier/atelier-film.mp4` is H.264/AAC, 1080 × 1920, 60 fps, 30 seconds, with 1,800 captured frames. The audio is mastered to an audible listening level. The native player has controls and captions; the video download includes audio.

1. Start `npm run dev:fashion`.
2. Run `python scripts/make-atelier-sound.py` (requires NumPy).
3. Set `FFMPEG_EXE` to your FFmpeg executable; optionally set `BROWSER_EXE`.
4. Run `npm run render:fashion`.
5. Run `python scripts/verify-fashion-film.py` to decode the full film, check 60 fps/1,800 frames, measure audio loudness, and create a review storyboard.

`npm run check:fashion` tests desktop/mobile interactions and verifies music starts, pauses, and resumes with the sound controls. `node scripts/render-fashion-film.cjs --preview` additionally checks original images and visible tap indicators at their timeline timestamps.

Vercel receives pre-rendered images and video through `npm run build`. It does not need a browser, Python, a model API, or FFmpeg. Earlier assets remain in the repository as historical artifacts; the current page references only the new `media/atelier/` collection.
