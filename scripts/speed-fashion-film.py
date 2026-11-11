"""Create and verify the 15-second, 2x Atelier film from the original export."""
import json
import os
import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parent.parent
media = root / "morrow-site/fashion-demo/public/media/atelier"
source = media / "atelier-film.mp4"
video = media / "atelier-film-2x.mp4"
encoder = os.environ.get("FFMPEG_EXE")
if not encoder:
    import imageio_ffmpeg
    encoder = imageio_ffmpeg.get_ffmpeg_exe()

subprocess.run([
    encoder, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source),
    "-filter_complex",
    "[0:v:0]setpts=(PTS-STARTPTS)/2,fps=60[v];[0:a:0]atempo=2,apad[a]",
    "-map", "[v]", "-map", "[a]", "-t", "15", "-fps_mode", "cfr",
    "-c:v", "libx264", "-preset", "fast", "-crf", "19",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(video),
], check=True)

def half_timestamp(match):
    minutes, seconds, millis = map(int, match.groups())
    total = round((minutes * 60000 + seconds * 1000 + millis) / 2)
    return f"{total // 60000:02d}:{total // 1000 % 60:02d}.{total % 1000:03d}"

captions = (media / "atelier-captions.vtt").read_text(encoding="utf-8")
(media / "atelier-captions-2x.vtt").write_text(
    re.sub(r"(\d{2}):(\d{2})\.(\d{3})", half_timestamp, captions),
    encoding="utf-8",
)

probe = subprocess.run([encoder, "-hide_banner", "-i", str(video)],
                       capture_output=True, text=True).stderr
assert "1080x1920" in probe and "60 fps" in probe and "Video: h264" in probe, probe
assert "Audio: aac" in probe, probe
duration = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", probe)
assert duration, probe
seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
assert abs(seconds - 15) < 0.1, seconds
decode = subprocess.run([
    encoder, "-v", "error", "-i", str(video), "-map", "0:v:0", "-map", "0:a:0",
    "-progress", "pipe:1", "-f", "null", "-",
], capture_output=True, text=True)
assert decode.returncode == 0 and not decode.stderr.strip(), decode.stderr
frames = re.findall(r"frame=(\d+)", decode.stdout)
assert frames and int(frames[-1]) == 900, decode.stdout
level = subprocess.run([
    encoder, "-hide_banner", "-i", str(video), "-af", "volumedetect",
    "-vn", "-sn", "-f", "null", "-",
], capture_output=True, text=True).stderr
average = re.search(r"mean_volume: (-?[0-9.]+) dB", level)
assert average and float(average[1]) > -22, level
report = {
    "speed": 2, "duration_seconds": seconds, "frames": 900,
    "width": 1080, "height": 1920, "fps": 60, "video": "H.264", "audio": "AAC",
    "audio_mean_dbfs": float(average[1]), "audio_pitch_preserved": True,
    "full_video_and_audio_decode": "passed", "captions_retimed": True,
    "bytes": video.stat().st_size,
}
(media / "atelier-film-2x-info.json").write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
