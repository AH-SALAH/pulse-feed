import { describe, it, expect } from "vitest";
import { TickBuffer } from "./tick-buffer";
import type { Tick } from "./types";

function makeTick(i: number): Tick {
  return { symbol: "BTCUSDT", price: 60000 + i, changePct: 0.1 * i, timestamp: i };
}

describe("TickBuffer", () => {
  it("retains exactly the most recent 200 ticks after 250 pushes", () => {
    const buffer = new TickBuffer();
    for (let i = 0; i < 250; i++) {
      buffer.push(makeTick(i));
    }
    const window = buffer.getWindow();
    expect(window).toHaveLength(200);
    expect(window[0]).toEqual(makeTick(50));
    expect(window[199]).toEqual(makeTick(249));
  });

  it("returns all ticks while under the cap", () => {
    const buffer = new TickBuffer();
    for (let i = 0; i < 3; i++) {
      buffer.push(makeTick(i));
    }
    expect(buffer.getWindow()).toHaveLength(3);
  });

  it("returns a copy, not a live reference", () => {
    const buffer = new TickBuffer();
    buffer.push(makeTick(0));
    const window = buffer.getWindow();
    window.push(makeTick(999));
    expect(buffer.getWindow()).toHaveLength(1);
  });
});