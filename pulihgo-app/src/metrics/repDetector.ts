// src/metrics/repDetector.ts
// OWNER: Pradipta · STATUS: ✅ working baseline (TUNE the thresholds to your phone)
//
// Counts one rep each time the limb rotates PAST `enterDeg` and comes back
// under `exitDeg` (hysteresis, so noise near zero doesn't double-count).
// Feed it calibrated angle samples for your chosen axis via push().
//
// enterDeg/exitDeg can be derived from a patient's targetRomDeg (see
// ExerciseConfig in ../types) instead of hardcoded: a severe-stroke patient
// with a small target ROM needs a much lower bar to register a rep than the
// fixed 40deg/15deg default, which would just never fire for them. Rep
// counting itself stays independent of hitting the target either way — a
// rep still counts even if its peak angle falls short of targetRomDeg, this
// only changes how big a swing has to be to register as a rep at all.

export interface RepEvent {
  index: number;
  peakRomDeg: number;
  durationMs: number;
  samples: number[];
}

export interface RepDetectorOptions {
  enterDeg?: number;     // must exceed this to START a rep
  exitDeg?: number;      // must drop below this to FINISH a rep
  // Optional: derive enterDeg/exitDeg proportionally from a patient's
  // prescribed target ROM (enterDeg = targetRomDeg * 0.45, exitDeg =
  // targetRomDeg * 0.18) instead of using the fixed 40/15 default. Ignored
  // for a given threshold if that threshold is also passed explicitly.
  targetRomDeg?: number;
}

export class RepDetector {
  private enter: number;
  private exit: number;
  private armed = false;
  private count = 0;
  private startMs = 0;
  private buf: number[] = [];

  onRep?: (rep: RepEvent) => void;

  constructor(opts: RepDetectorOptions = {}) {
    // TODO(clinical/tune): 0.45 / 0.18 are placeholder ratios — tune against
    // real captures across a range of target ROMs.
    const derivedEnter = opts.targetRomDeg !== undefined ? opts.targetRomDeg * 0.45 : undefined;
    const derivedExit = opts.targetRomDeg !== undefined ? opts.targetRomDeg * 0.18 : undefined;
    // Fall back to the fixed 40/15 baseline when no targetRomDeg is given,
    // so existing `new RepDetector()` callers (e.g. ExerciseScreen) keep
    // working unchanged.
    this.enter = opts.enterDeg ?? derivedEnter ?? 40;
    this.exit = opts.exitDeg ?? derivedExit ?? 15;
  }

  push(angleDeg: number, tMs: number) {
    const mag = Math.abs(angleDeg);

    if (!this.armed && mag > this.enter) {
      this.armed = true;
      this.startMs = tMs;
      this.buf = [angleDeg];
      return;
    }
    if (this.armed) {
      this.buf.push(angleDeg);
      if (mag < this.exit) {
        this.armed = false;
        this.count += 1;
        const peak = Math.max(...this.buf.map(Math.abs));
        this.onRep?.({
          index: this.count,
          peakRomDeg: peak,
          durationMs: tMs - this.startMs,
          samples: this.buf,
        });
        this.buf = [];
      }
    }
  }

  get reps() {
    return this.count;
  }

  reset() {
    this.armed = false;
    this.count = 0;
    this.buf = [];
  }
}
