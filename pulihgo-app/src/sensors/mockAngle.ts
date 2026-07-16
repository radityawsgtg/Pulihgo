// src/sensors/mockAngle.ts
// OWNER: shared · STATUS: helper
// Fake forearm supination/pronation so metrics can be built WITHOUT a phone.
// Pass an increasing time (ms) and get a smooth -80°..+80° sweep back and forth.

export const mockRoll = (tMs: number) => 80 * Math.sin(tMs / 600);

// Convenience: generate a stream of samples (e.g. to unit-test the rep detector).
export function makeMockSamples(reps = 5, dtMs = 50) {
  const out: { t: number; value: number }[] = [];
  const periodMs = 1200; // one back-and-forth
  const total = reps * periodMs;
  for (let t = 0; t <= total; t += dtMs) out.push({ t, value: mockRoll(t) });
  return out;
}
