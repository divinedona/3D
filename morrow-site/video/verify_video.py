"""Decode the delivered MP4, verify its streams, and extract a review frame."""

import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / ".scratch" / "video-tools"))
import imageio_ffmpeg

encoder = imageio_ffmpeg.get_ffmpeg_exe()
output = HERE / "output" / "front-walk"
video = output / "a-little-rain-front-walk.mp4"
probe = subprocess.run([encoder, "-hide_banner", "-i", str(video)], capture_output=True, text=True)
info = probe.stderr
duration = re.search(r"Duration: (\d+):(\d+):(\d+\.\d+)", info)
assert duration, info
seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
assert abs(seconds - 15) < 0.1, info
assert "1080x1080" in info and "24 fps" in info and "h264" in info, info
assert "Audio: aac" in info, info
decode = subprocess.run([encoder, "-hide_banner", "-v", "error", "-i", str(video),
                         "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"],
                        capture_output=True, text=True)
assert decode.returncode == 0 and not decode.stderr.strip(), decode.stderr
review = output / "verified-umbrella-frame.png"
subprocess.run([encoder, "-hide_banner", "-v", "error", "-y", "-ss", "11.7", "-i", str(video),
                "-frames:v", "1", str(review)], check=True)
walking_review = output / "verified-front-walking-frame.png"
subprocess.run([encoder, "-hide_banner", "-v", "error", "-y", "-ss", "2.8", "-i", str(video),
                "-frames:v", "1", str(walking_review)], check=True)
report = {"full_video_and_audio_decode": "passed", "duration_seconds": seconds,
          "resolution": "1080x1080", "fps": 24, "video": "H.264", "audio": "AAC",
          "bytes": video.stat().st_size, "review_frame": str(review),
          "walking_review_frame": str(walking_review)}
(output / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
