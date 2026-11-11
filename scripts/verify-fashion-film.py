"""Fully decode the portrait film and create a small review storyboard."""
import json
import os
import re
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
output = root / 'morrow-site/fashion-demo/public/media'
video = output / 'morrow-studio-film.mp4'
encoder = os.environ.get('FFMPEG_EXE')
if not encoder:
    import imageio_ffmpeg
    encoder = imageio_ffmpeg.get_ffmpeg_exe()
probe = subprocess.run([encoder, '-hide_banner', '-i', str(video)], capture_output=True, text=True)
info = probe.stderr
assert '1080x1920' in info and '24 fps' in info and 'Video: h264' in info, info
assert 'Audio: aac' in info, info
match = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', info)
assert match, info
seconds = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
assert abs(seconds - 30) < 0.1, seconds
decode = subprocess.run([encoder, '-v', 'error', '-i', str(video), '-map', '0:v:0', '-map', '0:a:0', '-progress', 'pipe:1', '-f', 'null', '-'], capture_output=True, text=True)
assert decode.returncode == 0 and not decode.stderr.strip(), decode.stderr
frames = re.findall(r'frame=(\d+)', decode.stdout)
assert frames and int(frames[-1]) == 720, decode.stdout

times = [1.5, 6, 10.5, 16, 20.5, 24, 27, 29.5]
sheet = Image.new('RGB', (1080, 1030), '#eee9df')
draw = ImageDraw.Draw(sheet)
for index, timestamp in enumerate(times):
    picture = root / '.scratch/fashion-qa' / f'film-{int(timestamp * 24)}.png'
    tile = Image.open(picture).convert('RGB').resize((270, 480), Image.Resampling.LANCZOS)
    x, y = index % 4 * 270, index // 4 * 515
    sheet.paste(tile, (x, y))
    draw.text((x + 10, y + 488), f'{timestamp:04.1f}s / MORROW STUDIO', fill='#68745a')
sheet.save(output / 'storyboard.jpg', quality=93)
review = output / 'verified-outfit-frame.jpg'
subprocess.run([encoder, '-v', 'error', '-y', '-ss', '10.5', '-i', str(video), '-frames:v', '1', str(review)], check=True)
report = {'full_video_and_audio_decode': 'passed', 'frames': 720, 'duration_seconds': seconds,
          'width': 1080, 'height': 1920, 'fps': 24, 'video': 'H.264', 'audio': 'AAC', 'bytes': video.stat().st_size}
(output / 'verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
