"""Fully decode the portrait film and create a small review storyboard."""
import json
import os
import re
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
output = root / 'morrow-site/fashion-demo/public/media/atelier'
video = output / 'atelier-film.mp4'
encoder = os.environ.get('FFMPEG_EXE')
if not encoder:
    import imageio_ffmpeg
    encoder = imageio_ffmpeg.get_ffmpeg_exe()
probe = subprocess.run([encoder, '-hide_banner', '-i', str(video)], capture_output=True, text=True)
info = probe.stderr
assert '1080x1920' in info and '60 fps' in info and 'Video: h264' in info, info
assert 'Audio: aac' in info, info
match = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', info)
assert match, info
seconds = int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])
assert abs(seconds - 30) < 0.1, seconds
decode = subprocess.run([encoder, '-v', 'error', '-i', str(video), '-map', '0:v:0', '-map', '0:a:0', '-progress', 'pipe:1', '-f', 'null', '-'], capture_output=True, text=True)
assert decode.returncode == 0 and not decode.stderr.strip(), decode.stderr
frames = re.findall(r'frame=(\d+)', decode.stdout)
assert frames and int(frames[-1]) == 1800, decode.stdout

times = [2.65, 7.5, 10.55, 11.3, 17.85, 19.45, 24.15, 27.2, 29.4]
sheet = Image.new('RGB', (810, 1545), '#eee9df')
draw = ImageDraw.Draw(sheet)
for index, timestamp in enumerate(times):
    picture = root / '.scratch/atelier-qa' / f'film-{round(timestamp * 60)}.png'
    tile = Image.open(picture).convert('RGB').resize((270, 480), Image.Resampling.LANCZOS)
    x, y = index % 3 * 270, index // 3 * 515
    sheet.paste(tile, (x, y))
    draw.text((x + 10, y + 488), f'{timestamp:04.1f}s / MORROW ATELIER', fill='#68745a')
sheet.save(output / 'storyboard.jpg', quality=93)
review = output / 'verified-outfit-frame.jpg'
subprocess.run([encoder, '-v', 'error', '-y', '-ss', '10.55', '-i', str(video), '-frames:v', '1', str(review)], check=True)
level = subprocess.run([encoder, '-hide_banner', '-i', str(video), '-af', 'volumedetect', '-vn', '-sn', '-f', 'null', '-'], capture_output=True, text=True)
average = re.search(r'mean_volume: (-?[0-9.]+) dB', level.stderr)
assert average and float(average[1]) > -22, level.stderr
report = {'audio_mean_dbfs': float(average[1]), 'tap_sound_events': 8, 'full_video_and_audio_decode': 'passed', 'frames': 1800, 'duration_seconds': seconds,
          'width': 1080, 'height': 1920, 'fps': 60, 'video': 'H.264', 'audio': 'AAC', 'bytes': video.stat().st_size}
(output / 'verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
