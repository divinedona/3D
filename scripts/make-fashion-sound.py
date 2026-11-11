"""Generate an original quiet soundtrack, without reference-video audio."""
from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'morrow-site/fashion-demo/public/media'
OUT.mkdir(parents=True, exist_ok=True)
rate, duration = 22050, 30
sound = np.zeros(rate * duration, dtype=np.float64)
notes = [(0.0, 220.0), (3.0, 261.63), (6.0, 329.63), (9.0, 293.66),
         (12.0, 220.0), (15.0, 261.63), (18.0, 349.23), (21.0, 329.63),
         (24.0, 261.63), (27.0, 220.0)]
for start, hz in notes:
    length = min(int(5 * rate), len(sound) - int(start * rate))
    t = np.arange(length) / rate
    envelope = np.minimum(t / 0.035, 1) * np.exp(-t * 0.95)
    tone = np.sin(2 * np.pi * hz * t) + 0.32 * np.sin(2 * np.pi * hz * 2 * t)
    tone += 0.13 * np.sin(2 * np.pi * hz * 3 * t)
    sound[int(start * rate):int(start * rate) + length] += tone * envelope * 0.075
for start in [3, 8, 13, 18, 23, 26, 28]:
    t = np.arange(int(0.12 * rate)) / rate
    click = np.sin(2 * np.pi * 880 * t) * np.exp(-t * 45) * 0.018
    i = int(start * rate)
    sound[i:i + len(click)] += click
fade = np.ones(len(sound))
fade[-2 * rate:] = np.linspace(1, 0, 2 * rate)
sound = np.clip(sound * fade, -1, 1)
with wave.open(str(OUT / 'studio-sound.wav'), 'wb') as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(rate)
    audio.writeframes((sound * 32767).astype('<i2').tobytes())
print(OUT / 'studio-sound.wav')
