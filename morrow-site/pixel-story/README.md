# Morrow Pixel Stories

A separate page and original 2D pixel-art version of the 15-second walking/rain/umbrella story. All sprites and scenery are drawn on a 270 × 270 grid and enlarged with nearest-neighbor sampling to 1080 × 1080. The video is 24 fps H.264 with original synthesized rain and footsteps.

From the project root:

```powershell
.\node_modules\.bin\vite.cmd --config morrow-site/pixel-story/vite.config.mjs
```

Open http://127.0.0.1:5182/. The landing page has its own server at port 5180.

Build this page with:

```powershell
.\node_modules\.bin\vite.cmd build --config morrow-site/pixel-story/vite.config.mjs
```

The video, poster, and storyboard live in `public/media` and are included in the page's build. Render them using Python with NumPy/Pillow and `imageio-ffmpeg` installed in `.scratch/video-tools`:

```powershell
python morrow-site/pixel-story/render_pixel_story.py --preview
python morrow-site/pixel-story/render_pixel_story.py
```

The full render validates the exported video and audio before completing. This page and renderer do not modify the 3D landing page or either existing voxel video.
