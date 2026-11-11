# A little rain

An original 15-second square 3D voxel animation: a character walks straight toward the camera along a walkway, reacts to rain, takes out an umbrella, opens it, and continues forward. The perspective camera is centered on the route. Two-joint legs keep each foot on the ground during its planted phase. Export: 1080 × 1080, 24 fps, H.264 MP4 with original synthesized rain, footsteps, and umbrella sounds.

The meshes are actual articulated cubes in 3D space. A small CPU renderer projects and shades their visible faces, then Pillow composes rain, titles, and the final camera-style push-in. This workflow does not capture the website or use cursor-driven animation.

## Story timing

| Time | Action |
| --- | --- |
| 0–4 s | Walking; “Just a little walk.” |
| 4–6 s | Rain begins; character pauses and looks up |
| 6–8 s | Reaches for and raises the folded umbrella |
| 8–9 s | Stepped voxel canopy expands |
| 9–15 s | Continues walking under the umbrella; “Keep going anyway.” |

## Rendering

Run from the Berd repository root with a Python environment containing NumPy and Pillow. Install `imageio-ffmpeg` into `.scratch/video-tools` for the encoder. The script uses the repository's licensed local font files.

```powershell
python -m pip install --target .scratch/video-tools imageio-ffmpeg
python morrow-site/video/render_voxel_story.py --preview --size 720
python morrow-site/video/render_voxel_story.py --size 1080
python morrow-site/video/verify_video.py
```

The revised outputs are in `video/output/front-walk`: the MP4, six storyboard PNGs, a storyboard contact sheet, an original WAV soundtrack, and a JSON specification. The original sideways-walk MP4 remains in `video/output`. `--preview` only produces the storyboard. The environment used to make this video supplies NumPy and Pillow through Codex's bundled Python runtime.

No third-party footage or music was used. This is an original voxel character inspired by the requested style; it is separate from the smooth Three.js characters on the Morrow landing page.
