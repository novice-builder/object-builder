/** Bounded fixed-step simulation; a resumed tab never simulates minutes of catch-up. */
export class FixedClock {
  private previous = 0;
  private accumulator = 0;
  constructor(
    readonly step = 1 / 60,
    readonly maxSteps = 5,
  ) {}
  reset(now: number) {
    this.previous = now;
    this.accumulator = 0;
  }
  tick(now: number, update: (dt: number) => void) {
    const elapsed = Math.max(0, Math.min(0.1, (now - this.previous) / 1000));
    this.previous = now;
    this.accumulator = Math.min(
      this.accumulator + elapsed,
      this.step * this.maxSteps,
    );
    let count = 0;
    while (this.accumulator + 1e-9 >= this.step && count < this.maxSteps) {
      update(this.step);
      this.accumulator -= this.step;
      count++;
    }
    return count;
  }
}
