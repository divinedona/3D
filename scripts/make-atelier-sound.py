"""Create original music and clearly audible effects from the shared tap timeline."""
from pathlib import Path
import json
import wave
import numpy as np

root = Path(__file__).resolve().parent.parent
out = root / 'morrow-site/fashion-demo/public/media/atelier'
out.mkdir(parents=True, exist_ok=True)
timeline = json.loads((root / 'morrow-site/fashion-demo/timeline.json').read_text())
rate, duration = 44100, timeline['duration']
music = np.zeros(rate * duration, dtype=np.float64)

def add(track, start, signal):
    offset = int(start * rate)
    size = min(len(signal), len(track) - offset)
    track[offset:offset + size] += signal[:size]

for bar, notes in enumerate([[196, 246.94, 293.66], [174.61, 220, 261.63], [164.81, 196, 246.94], [146.83, 196, 246.94], [196, 246.94, 293.66], [174.61, 220, 261.63], [164.81, 196, 246.94], [196, 246.94, 293.66]]):
    for index, hz in enumerate(notes):
        t = np.arange(int(4 * rate)) / rate
        envelope = np.minimum(t / 0.045, 1) * np.exp(-t * 1.15)
        tone = np.sin(2 * np.pi * hz * t) + 0.25 * np.sin(2 * np.pi * hz * 2 * t)
        add(music, bar * 3.75 + index * 0.26, tone * envelope * 0.17)
for beat in np.arange(0.6, 29, 0.75):
    t = np.arange(int(0.15 * rate)) / rate
    kick = np.sin(2 * np.pi * (90 * t - 160 * t * t)) * np.exp(-t * 27) * 0.045
    add(music, beat, kick)

def effect(kind):
    notes = {'tap': [920], 'select': [690, 1035], 'success': [523.25, 659.25, 783.99], 'message': [520, 780]}[kind]
    result = np.zeros(int(0.32 * rate))
    for index, hz in enumerate(notes):
        t = np.arange(int(0.18 * rate)) / rate
        envelope = np.minimum(t / 0.003, 1) * np.exp(-t * 42)
        signal = np.sin(2 * np.pi * hz * (t - 0.36 * t * t)) * envelope * (0.24 if kind == 'tap' else 0.20)
        offset = int(index * 0.038 * rate)
        result[offset:offset + len(signal)] += signal
    return result

fade = np.minimum(np.arange(len(music)) / rate / 0.3, 1)
fade[-int(1.5 * rate):] *= np.linspace(1, 0, int(1.5 * rate))
music *= fade * 1.55
mix = music.copy()
for tap in timeline['taps']: add(mix, tap['time'], effect(tap['kind']))
for at in timeline['messages']: add(mix, at, effect('message') * 0.65)

def save(name, signal):
    signal = np.clip(signal, -0.95, 0.95)
    stereo = np.column_stack((signal, signal))
    with wave.open(str(out / name), 'wb') as audio:
        audio.setnchannels(2); audio.setsampwidth(2); audio.setframerate(rate)
        audio.writeframes((stereo * 32767).astype('<i2').tobytes())
    return {'rms_dbfs': float(20 * np.log10(np.sqrt(np.mean(signal * signal)) + 1e-9)), 'peak_dbfs': float(20 * np.log10(np.max(np.abs(signal)) + 1e-9))}

report = {'music': save('atelier-music.wav', music), 'film_mix': save('atelier-sound.wav', mix), 'tap_events': timeline['taps']}
for kind in ['tap', 'select', 'success', 'message']: save(f'{kind}.wav', effect(kind))
(out / 'audio-info.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report, indent=2))
