import type { Tick } from "./types";

const MAX_TICKS = 200;

export class TickBuffer {
  private ticks: Tick[] = [];

  push(tick: Tick): void {
    this.ticks.push(tick);
    if (this.ticks.length > MAX_TICKS) {
      this.ticks.splice(0, this.ticks.length - MAX_TICKS);
    }
  }

  getWindow(): Tick[] {
    return [...this.ticks];
  }
}