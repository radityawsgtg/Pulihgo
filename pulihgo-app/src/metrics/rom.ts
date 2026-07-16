// src/metrics/rom.ts
// OWNER: Pradipta · STATUS: ✅ working baseline
// Range of motion for a set of angle samples = full peak-to-peak excursion (degrees).

export function peakRom(samples: number[]): number {
  if (samples.length === 0) return 0;
  return Math.max(...samples) - Math.min(...samples);
}
