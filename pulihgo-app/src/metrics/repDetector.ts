// src/metrics/repDetector.ts
// OWNER: Pradipta · STATUS: ✅ working baseline (TUNE the thresholds to your phone)
//
// Counts one rep each time the limb rotates PAST `enterDeg` and comes back
// under `exitDeg` (hysteresis, so noise near zero doesn't double-count).
// Feed it calibrated angle samples for your chosen axis via push().

export interface RepEvent {
  index: number;
  peakRomDeg: number;
  durationMs: number;
  samples: number[];
}

export interface RepDetectorOptions {
  enterDeg?: number; // must exceed this to START a rep
  exitDeg?: number;  // must drop below this to FINISH a rep
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
    // TODO(tune): pick these from a real forearm capture. Good starting point:
    this.enter = opts.enterDeg ?? 40;
    this.exit = opts.exitDeg ?? 15;
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
