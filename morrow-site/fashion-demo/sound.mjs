let context;
const frequencies = {
  tap: [920],
  select: [690, 1035],
  success: [523.25, 659.25, 783.99],
  message: [520, 780],
};

export async function resumeSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return false;
  context ||= new AudioContext();
  await context.resume();
  return true;
}

export function playSound(kind = "tap") {
  if (!context || context.state !== "running") return;
  const start = context.currentTime;
  for (const [index, frequency] of (
    frequencies[kind] || frequencies.tap
  ).entries()) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = start + index * 0.038;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 0.86,
      at + 0.12,
    );
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(
      kind === "success" ? 0.14 : 0.2,
      at + 0.003,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(at);
    oscillator.stop(at + 0.18);
  }
}

export function soundState() {
  return context?.state || "uninitialized";
}
