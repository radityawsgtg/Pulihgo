// src/metrics/smoothness.ts
// OWNER: Pradipta · STATUS: 🟡 approximate baseline (TUNE the SCALE)
// A healthy movement is one smooth arc; an impaired one is shaky.
// We estimate "jerk" (how abruptly motion changes) and map it to a 0..1 score
// where higher = smoother. Good enough to show a quality trend in the MVP.

export function smoothness(samples: number[], dtMs = 50): number {
  if (samples.length < 4) return 1;
  const dt = dtMs / 1000;
  let jerkSq = 0;
  let n = 0;
  for (let i = 3; i < samples.length; i++) {
    // 3rd difference ≈ jerk
    const jerk =
      (samples[i] - 3 * samples[i - 1] + 3 * samples[i - 2] - samples[i - 3]) /
      (dt * dt * dt);
    jerkSq += jerk * jerk;
    n += 1;
  }
  const rms = Math.sqrt(jerkSq / Math.max(n, 1));
  const SCALE = 200000; // TODO(tune): calibrate to your captured data
  return 1 / (1 + rms / SCALE);
}
