"""Render an original 3D voxel story without a browser or GPU dependency.

Usage: bundled-python render_voxel_story.py [--preview] [--size 1080]
The cube meshes, articulated walk, umbrella, rain, camera, and audio are procedural.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUTPUT = HERE / "output" / "front-walk"
sys.path.insert(0, str(ROOT / ".scratch" / "video-tools"))

FPS = 24
DURATION = 15
PAPER = np.array([241, 242, 230])
WET_SKY = np.array([173, 194, 208])
INK = (32, 48, 43)
VERTS = np.array([
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
], dtype=float) * 0.5
FACES = [
    ([1, 5, 6, 2], [1, 0, 0]), ([4, 0, 3, 7], [-1, 0, 0]),
    ([3, 2, 6, 7], [0, 1, 0]), ([0, 4, 5, 1], [0, -1, 0]),
    ([5, 4, 7, 6], [0, 0, 1]), ([0, 1, 2, 3], [0, 0, -1]),
]
CAMERA = np.array([0.0, 4.8, 10.5])
LOOK_AT = np.array([0.0, 1.15, -0.7])
CAMERA_DISTANCE = np.linalg.norm(CAMERA - LOOK_AT)
FORWARD = (CAMERA - LOOK_AT) / CAMERA_DISTANCE
RIGHT = np.cross([0, 1, 0], FORWARD)
RIGHT /= np.linalg.norm(RIGHT)
UP = np.cross(FORWARD, RIGHT)
LIGHT = np.array([-0.45, 0.8, 0.55])
LIGHT /= np.linalg.norm(LIGHT)


def ease(value):
    v = float(np.clip(value, 0, 1))
    return v * v * (3 - 2 * v)


def ry(angle):
    c, s = math.cos(angle), math.sin(angle)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rx(angle):
    c, s = math.cos(angle), math.sin(angle)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def rz(angle):
    c, s = math.cos(angle), math.sin(angle)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


IDENTITY = np.eye(3)


class Renderer:
    def __init__(self, size):
        self.size = size
        self.scale = size / 10.3
        self.focal = size * 1.03
        self.origin = np.array([size * 0.5, size * 0.65])
        self.polygons = []

    def project(self, points):
        pts = np.asarray(points)
        relative = pts - LOOK_AT
        depth = CAMERA_DISTANCE - relative @ FORWARD
        ratio = self.focal / np.maximum(depth, 0.5)
        return np.stack([
            self.origin[0] + (relative @ RIGHT) * ratio,
            self.origin[1] - (relative @ UP) * ratio,
        ], axis=-1)

    def cube(self, center, size, color, rotation=IDENTITY):
        center = np.asarray(center)
        dimensions = np.broadcast_to(np.asarray(size), (3,))
        verts = (VERTS * dimensions) @ rotation.T + center
        projected = self.project(verts)
        for indices, normal in FACES:
            normal = rotation @ np.array(normal)
            face_center = verts[indices].mean(axis=0)
            if normal @ (CAMERA - face_center) <= 0.001:
                continue
            depth = float(face_center @ FORWARD)
            shade = 0.64 + 0.32 * max(0.0, float(normal @ LIGHT))
            fill = tuple(int(min(255, c * shade)) for c in color)
            coords = [tuple(p) for p in projected[indices]]
            self.polygons.append((depth, coords, fill))

    def finish(self, image):
        draw = ImageDraw.Draw(image)
        for _, points, color in sorted(self.polygons, key=lambda p: p[0]):
            draw.polygon(points, fill=color)
        self.polygons.clear()


def voxel_block(renderer, center, counts, step, color, rotation=IDENTITY, jitter=5):
    counts = np.array(counts)
    center = np.array(center)
    for x in range(counts[0]):
        for y in range(counts[1]):
            for z in range(counts[2]):
                # Interior voxels contribute no surface; omit them.
                if 0 < x < counts[0] - 1 and 0 < y < counts[1] - 1 and 0 < z < counts[2] - 1:
                    continue
                local = (np.array([x, y, z]) - (counts - 1) / 2) * step
                vary = ((x * 11 + y * 5 + z * 17) % 5 - 2) * jitter / 2
                col = tuple(int(np.clip(c + vary, 0, 255)) for c in color)
                renderer.cube(center + rotation @ local, step * 0.985, col, rotation)


def draw_background(renderer, wet=False):
    sky = tuple(WET_SKY.astype(int) if wet else PAPER.astype(int))
    image = Image.new("RGB", (renderer.size, renderer.size), sky)
    # A straight walkway recedes in perspective, with borders and street furniture.
    draw = ImageDraw.Draw(image)
    grid = max(18, renderer.size // 35)
    for y in range(grid, int(renderer.size * 0.78), grid):
        for x in range(grid, renderer.size, grid):
            draw.point((x, y), fill=(150, 173, 179) if wet else (207, 214, 198))
    renderer.cube([0, -0.23, -5], [15, 0.24, 24], (115, 149, 103) if not wet else (97, 132, 115))
    renderer.finish(image)
    for x in range(-3, 4):
        for z in range(-28, 12):
            c = (156, 175, 179) if wet else (212, 211, 188)
            variation = ((x * 9 + z * 7) % 5 - 2) * 3
            renderer.cube([x * 0.52, 0.006, z * 0.52], [0.505, 0.03, 0.505],
                          tuple(v + variation for v in c))
    renderer.finish(image)
    for side in [-1, 1]:
        for z in range(-28, 12):
            renderer.cube([side * 1.88, 0.04, z * 0.52], [0.20, 0.16, 0.51], (149, 160, 145))
        for z in [-9, -5, -1, 3]:
            renderer.cube([side * 2.8, 0.20, z], [0.9, 0.4, 0.75], (176, 137, 108))
            for dx, y, dimensions, col in [
                (-0.22, 0.55, [0.35, 0.5, 0.4], (121, 154, 96)),
                (0.20, 0.72, [0.4, 0.8, 0.4], (150, 179, 108)),
                (0.0, 1.12, [0.6, 0.38, 0.58], (172, 190, 125)),
            ]:
                renderer.cube([side * 2.8 + dx, y, z], dimensions, col)
    # Benches sit beside the path rather than in the character's route.
    for x, z in [(3.8, -3.2), (-3.8, -7.3)]:
        renderer.cube([x, 0.48, z], [1.15, 0.14, 0.54], (193, 158, 114))
        for dx in [-0.43, 0.43]:
            renderer.cube([x + dx, 0.22, z], [0.13, 0.45, 0.38], (75, 97, 84))
        renderer.cube([x, 0.83, z - 0.28], [1.15, 0.48, 0.12], (193, 158, 114))
    renderer.finish(image)
    return image


def walking_z(t):
    if t < 4.1:
        return -4.2 + 0.58 * t
    if t < 4.55:
        q = (t - 4.1) / 0.45
        return -4.2 + 0.58 * (4.1 + 0.45 * (q - q ** 3 + 0.5 * q ** 4))
    if t < 9.0:
        return -1.6915
    if t < 9.5:
        q = (t - 9.0) / 0.5
        return -1.6915 + 0.44 * 0.5 * (q ** 3 - 0.5 * q ** 4)
    return -1.6915 + 0.44 * (t - 9.25)


def draw_character(renderer, t):
    root = np.array([0.0, 0.025, walking_z(t)])
    yaw = IDENTITY
    walking = (1 - ease((t - 4.1) / 0.45)) if t < 9 else ease((t - 9) / 0.5)
    phase = t * 8.3
    swing = math.sin(phase) * 0.32 * walking
    bob = abs(math.sin(phase)) * 0.024 * walking
    root[1] += bob

    def world(local):
        return root + yaw @ np.array(local)

    jacket = (244, 114, 68)
    skin = (245, 198, 147)
    hair = (76, 65, 52)
    pants = (93, 126, 151)
    dark = (40, 54, 49)

    # Two-joint legs: alternating planted feet and lifted return steps.
    # Foot centers stay at ground height in stance, eliminating the floating gait.
    for side in [-1, 1]:
        legphase = phase + (math.pi if side == -1 else 0)
        cycle = (legphase / (2 * math.pi)) % 1
        stride = (0.58 if t < 9 else 0.44) * (2 * math.pi / 8.3) / 4
        hip = np.array([side * 0.18, 0.88, 0])
        lift = max(0, math.sin(legphase)) * 0.10 * walking
        foot_z = (-stride + 2 * stride * ease(cycle * 2)) if cycle < 0.5 else stride * (3 - cycle * 4)
        foot = np.array([side * 0.18, 0.085 - root[1] + lift,
                         foot_z * walking + 0.04])
        delta = foot - hip
        length = np.linalg.norm(delta)
        direction = delta / length
        bend = np.array([0, direction[2], -direction[1]])
        knee = (hip + foot) * 0.5 + bend * math.sqrt(max(0, 0.455 ** 2 - (length / 2) ** 2))
        for top, bottom in [(hip, knee), (knee, foot)]:
            bone = top - bottom
            rotation = rx(math.atan2(bone[2], bone[1]))
            voxel_block(renderer, world((top + bottom) / 2), [1, 2, 2], 0.205, pants, rotation)
        renderer.cube(world(knee), [0.205, 0.16, 0.31], pants)
        renderer.cube(world(foot + [0, 0, 0.07]), [0.25, 0.15, 0.40], dark)
    voxel_block(renderer, world([0, 1.21, 0]), [3, 4, 2], 0.2, jacket, yaw)
    renderer.cube(world([0, 1.56, 0]), [0.28, 0.20, 0.28], skin, yaw)

    # A small blue backpack is visibly a carried prop.
    voxel_block(renderer, world([0, 1.24, -0.32]), [2, 3, 1], 0.19, (126, 152, 167), yaw)
    renderer.cube(world([0.22, 1.27, 0.216]), [0.055, 0.51, 0.045], (153, 85, 57), yaw)

    # Looking up after the first raindrops; then back toward the route.
    look = ease((t - 4.6) / 0.5) * (1 - ease((t - 6.0) / 0.5))
    headrot = yaw @ rx(-0.23 * look) @ ry(-0.12 * look)
    headcenter = world([0, 1.98, 0])
    voxel_block(renderer, headcenter, [4, 4, 3], 0.205, skin, headrot, jitter=3)
    # Blocky hair cap and fringe.
    voxel_block(renderer, headcenter + headrot @ [0, 0.39, -0.025],
                [4, 1, 3], 0.209, hair, headrot, jitter=8)
    for side in [-1, 1]:
        renderer.cube(headcenter + headrot @ [side * 0.324, 0.22, 0.31],
                      [0.18, 0.23, 0.08], hair, headrot)
    # Eyes, cheeks, mouth, and tiny catchlights remain separate voxel meshes.
    blink = 0.025 if ((t > 2.0 and t < 2.13) or (t > 10.5 and t < 10.64)) else 0.105
    for side in [-1, 1]:
        renderer.cube(headcenter + headrot @ [side * 0.17, 0.075, 0.317],
                      [0.115, blink, 0.045], dark, headrot)
        if blink > 0.05:
            renderer.cube(headcenter + headrot @ [side * 0.17 - 0.018, 0.098, 0.344],
                          [0.024, 0.024, 0.014], (255, 252, 229), headrot)
        renderer.cube(headcenter + headrot @ [side * 0.28, -0.09, 0.321],
                      [0.075, 0.055, 0.014], (230, 148, 123), headrot)
    renderer.cube(headcenter + headrot @ [0, -0.145, 0.324],
                  [0.12, 0.033, 0.03], dark, headrot)

    # Right hand reaches for the packed umbrella and raises it above the head.
    reach = ease((t - 6.2) / 0.8)
    raise_arm = ease((t - 7.0) / 0.9)
    left_angle = -swing
    right_angle = swing * (1 - reach) - reach * 0.68 - raise_arm * 0.68
    right_hand = None
    for side, angle in [(-1, left_angle), (1, right_angle)]:
        pivot = np.array([side * 0.43, 1.44, 0])
        armrot = rx(angle) @ rz(-side * 0.12)
        rot = yaw @ armrot
        voxel_block(renderer, world(pivot + armrot @ [0, -0.20, 0]),
                    [1, 3, 1], 0.16, jacket, rot)
        hand = world(pivot + armrot @ [0, -0.46, 0])
        renderer.cube(hand, [0.18, 0.19, 0.18], skin, rot)
        if side == 1:
            right_hand = hand

    if t >= 6.15:
        draw_umbrella(renderer, right_hand, t, raise_arm)


def draw_umbrella(renderer, hand, t, raised):
    opening = ease((t - 7.85) / 0.72)
    # Closed umbrella is carried diagonally; it rotates upright before opening.
    direction = np.array([0.30 * (1 - raised), 0.55 + 0.45 * raised, 0.18 * (1 - raised)])
    direction /= np.linalg.norm(direction)
    top = hand + direction * 1.75
    for j in range(15):
        pos = hand + direction * (j / 14 * 1.67)
        renderer.cube(pos, [0.07, 0.125, 0.07], (77, 88, 79))
    # Discrete square canopy cells expand from a closed bundle into a stepped dome.
    step = 0.18
    spread = 0.10 + opening * 0.90
    for ix in range(-6, 7):
        for iz in range(-6, 7):
            distance = math.hypot(ix, iz)
            if distance > 6.5:
                continue
            h = (0.47 * (1 - (distance / 6.5) ** 1.35)) * opening
            pos = top + np.array([ix * step * spread, h, iz * step * spread])
            color = (173, 202, 115) if (ix + iz) % 3 else (146, 178, 92)
            renderer.cube(pos, [step * spread * 0.98, 0.105 + (1 - opening) * 0.025,
                                step * spread * 0.98], color)
    renderer.cube(top + [0, 0.57 * opening, 0], [0.12, 0.15, 0.12], (76, 98, 65))


def draw_shadow(image, renderer, t):
    overlay = Image.new("RGBA", image.size)
    d = ImageDraw.Draw(overlay)
    point = renderer.project([[0, 0.045, walking_z(t)]])[0]
    edge = renderer.project([[0.55, 0.045, walking_z(t)]])[0]
    r = abs(edge[0] - point[0])
    d.ellipse([point[0] - r, point[1] - r * 0.3, point[0] + r, point[1] + r * 0.3],
              fill=(28, 48, 43, 60))
    overlay = overlay.filter(ImageFilter.GaussianBlur(renderer.size / 170))
    image.paste(overlay, (0, 0), overlay)


def draw_rain(image, renderer, t):
    intensity = ease((t - 4.0) / 1.0)
    if intensity <= 0:
        return
    overlay = Image.new("RGBA", image.size)
    d = ImageDraw.Draw(overlay)
    size = renderer.size
    rng = np.random.default_rng(4831)
    drops = rng.random((135, 4))
    count = int(135 * intensity)
    # Screen-space rain is layered over actual projected 3D objects.
    canopy_open = ease((t - 7.85) / 0.72)
    p = renderer.project([[0.47, 3.24, walking_z(t) + 0.48]])[0]
    edge = renderer.project([[1.52, 3.24, walking_z(t) + 0.48]])[0]
    protected_width = abs(edge[0] - p[0]) * canopy_open
    for x0, y0, speed, depth in drops[:count]:
        x = (x0 * size - (t - 4) * size * 0.044) % size
        y = (y0 * size + (t - 4) * size * (0.54 + speed * 0.4)) % size
        if canopy_open > 0.8 and abs(x - p[0]) < protected_width and p[1] < y < p[1] + size * 0.30:
            continue
        length = size * (0.013 + depth * 0.013)
        d.line([(x, y), (x - length * 0.22, y + length)],
               fill=(234, 245, 249, int(120 + depth * 60)), width=max(1, size // 650))
    # Deterministic rings in the pavement convey rain landing on the ground.
    for i in range(13):
        phase = ((t - 4) * 1.4 + i * 0.173) % 1
        x = (i * 1.153) % 3.1 - 1.55
        z = (i * 0.971) % 9.0 - 6.0
        pt = renderer.project([[x, 0.045, z]])[0]
        rr = (0.025 + phase * 0.12) * renderer.scale
        d.ellipse([pt[0] - rr, pt[1] - rr * 0.4, pt[0] + rr, pt[1] + rr * 0.4],
                  outline=(223, 237, 235, int((1 - phase) * 150)), width=max(1, size // 650))
    image.paste(overlay, (0, 0), overlay)


def font(size, kind="sans"):
    paths = {
        "sans": ROOT / "src/app/assets/fonts/Inter[opsz,wght].ttf",
        "serif": ROOT / "src/app/assets/fonts/Fraunces-Italic[SOFT,WONK,opsz,wght].ttf",
        "mono": ROOT / "src/app/assets/fonts/GeistMono[wght].ttf",
    }
    return ImageFont.truetype(str(paths[kind]), size)


def draw_titles(image, t):
    size = image.width
    layer = Image.new("RGBA", image.size)
    d = ImageDraw.Draw(layer)
    mono = font(round(size * 0.014), "mono")
    title = font(round(size * 0.061))
    serif = font(round(size * 0.058), "serif")
    small = font(round(size * 0.018))
    d.text((size * 0.07, size * 0.058), "MORROW / LITTLE STORIES", font=mono, fill=INK + (255,))
    d.text((size * 0.93, size * 0.058), "001", anchor="ra", font=mono, fill=INK + (255,))
    if t < 4:
        line1, line2 = "Just a little walk.", "See where it goes."
        alpha = int(255 * ease(t / 0.6) * (1 - ease((t - 3.45) / 0.5)))
    elif t < 9.0:
        line1, line2 = "A little rain.", "A little preparation."
        alpha = int(255 * ease((t - 4.1) / 0.55) * (1 - ease((t - 8.45) / 0.5)))
    else:
        line1, line2 = "A little weird.", "Keep going anyway."
        alpha = int(255 * ease((t - 9.15) / 0.55))
    offset = (1 - min(1, alpha / 255)) * size * 0.008
    d.text((size * 0.5, size * 0.135 + offset), line1, anchor="ma", font=title, fill=INK + (alpha,))
    d.text((size * 0.5, size * 0.211 + offset), line2, anchor="ma", font=serif, fill=INK + (alpha,))
    caption = "WALK. WONDER. KEEP GOING." if t < 13 else "GOOD THINGS START WITH A LITTLE POSSIBILITY."
    d.text((size * 0.5, size * 0.91), caption, anchor="ma", font=mono, fill=INK + (225,))
    # Small timeline dots make the three story beats visible.
    active = 0 if t < 4 else 1 if t < 9 else 2
    for i in range(3):
        x = size * 0.5 + (i - 1) * size * 0.018
        r = size * 0.0032
        color = (243, 113, 69, 255) if i == active else (105, 132, 127, 140)
        d.rectangle([x - r, size * 0.96 - r, x + r, size * 0.96 + r], fill=color)
    image.paste(layer, (0, 0), layer)


def make_audio(path):
    rate = 44100
    n = rate * DURATION
    clock = np.arange(n) / rate
    rng = np.random.default_rng(441)
    noise = rng.normal(0, 1, n)
    # Original synthesized rainfall: high-frequency hiss plus softened low texture.
    high = noise - np.convolve(noise, np.ones(7) / 7, mode="same")
    low = np.convolve(noise, np.ones(60) / 60, mode="same")
    rain_envelope = np.clip((clock - 4.05) / 1.2, 0, 1) * np.clip((15 - clock) / 0.35, 0, 1)
    audio = (high * 0.036 + low * 0.1) * rain_envelope
    for start in list(np.arange(0.25, 4.3, 0.38)) + list(np.arange(9.35, 14.7, 0.38)):
        idx = int(start * rate)
        width = int(rate * 0.095)
        tm = np.arange(width) / rate
        sound = (np.sin(2 * np.pi * 125 * tm) * 0.065 + rng.normal(0, 0.014, width)) * np.exp(-tm * 48)
        audio[idx:idx + width] += sound
    # A gentle umbrella opening swish and click, entirely synthesized.
    idx = int(7.85 * rate)
    width = int(0.72 * rate)
    tm = np.arange(width) / rate
    audio[idx:idx + width] += rng.normal(0, 0.035, width) * np.sin(np.pi * tm / 0.72) ** 2
    idx = int(8.57 * rate)
    width = int(0.075 * rate)
    tm = np.arange(width) / rate
    audio[idx:idx + width] += np.sin(2 * np.pi * 1100 * tm) * np.exp(-tm * 90) * 0.06
    audio *= np.minimum(1, clock / 0.15)
    pcm = (np.clip(audio, -0.95, 0.95) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(rate)
        f.writeframes(pcm.tobytes())


def render_frame(renderer, dry, wet, t):
    blend = ease((t - 3.8) / 1.4)
    image = Image.blend(dry, wet, blend)
    draw_shadow(image, renderer, t)
    draw_character(renderer, t)
    renderer.finish(image)
    draw_rain(image, renderer, t)
    # A restrained push-in on the composed scene; typography remains fixed.
    zoom = 1 + 0.035 * ease(t / DURATION)
    inverse = 1 / zoom
    cx, cy = image.width * 0.5, image.height * 0.60
    image = image.transform(image.size, Image.Transform.AFFINE,
                            (inverse, 0, cx * (1 - inverse), 0, inverse, cy * (1 - inverse)),
                            resample=Image.Resampling.BICUBIC)
    draw_titles(image, t)
    return image


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true")
    parser.add_argument("--size", type=int, default=1080)
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    renderer = Renderer(args.size)
    dry, wet = draw_background(renderer), draw_background(renderer, True)
    samples = [1.6, 5.5, 7.45, 8.8, 11.7, 14.4]
    for i, t in enumerate(samples):
        image = render_frame(renderer, dry, wet, t)
        image.save(OUTPUT / f"storyboard-{i + 1}.png")
    thumb = args.size // 2
    board = Image.new("RGB", (thumb * 3, thumb * 2), tuple(PAPER.astype(int)))
    for i in range(6):
        with Image.open(OUTPUT / f"storyboard-{i + 1}.png") as img:
            board.paste(img.resize((thumb, thumb), Image.Resampling.LANCZOS),
                        ((i % 3) * thumb, (i // 3) * thumb))
    board.save(OUTPUT / "storyboard.jpg", quality=93)
    print("Storyboard ready", flush=True)
    if args.preview:
        return

    import imageio_ffmpeg
    encoder = imageio_ffmpeg.get_ffmpeg_exe()
    audio = OUTPUT / "rain-and-footsteps.wav"
    make_audio(audio)
    output = OUTPUT / "a-little-rain-front-walk.mp4"
    command = [encoder, "-hide_banner", "-loglevel", "error", "-y",
               "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{args.size}x{args.size}",
               "-framerate", str(FPS), "-i", "pipe:0", "-i", str(audio),
               "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", str(output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for frame in range(FPS * DURATION):
            image = render_frame(renderer, dry, wet, frame / FPS)
            process.stdin.write(image.tobytes())
            if frame % 24 == 0:
                print(f"Rendered {frame // 24}/{DURATION}s", flush=True)
        process.stdin.close()
        code = process.wait()
        if code:
            raise RuntimeError(f"FFmpeg exited with {code}")
    except BaseException:
        process.kill()
        process.wait()
        raise
    metadata = {
        "title": "A little rain", "duration_seconds": DURATION,
        "width": args.size, "height": args.size, "fps": FPS,
        "frames": FPS * DURATION, "video_codec": "H.264", "audio_codec": "AAC",
        "story": ["walk straight toward camera on a walkway", "rain begins", "look up", "take out umbrella", "open umbrella", "continue forward"],
        "camera": "Centered front-facing perspective view",
        "assets": "Original procedural 3D voxel meshes and synthesized sound; local licensed fonts",
    }
    (OUTPUT / "video-info.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Finished: {output}", flush=True)


if __name__ == "__main__":
    main()
