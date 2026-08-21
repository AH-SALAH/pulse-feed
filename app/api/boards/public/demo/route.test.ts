import { describe, it, expect, beforeEach } from "vitest";
import { GET, limiter } from "./route";

const IP = "203.0.113.42";

function demoRequest(ip: string): Request {
  return new Request("http://localhost:3000/api/boards/public/demo", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("GET /api/boards/public/demo", () => {
  beforeEach(() => {
    limiter.reset();
  });

  it("returns the 4 fixed demo widgets", async () => {
    const res = await GET(demoRequest(IP));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.widgets.map((w: { symbol: string }) => w.symbol)).toEqual([
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "BNBUSDT",
    ]);
  });

  it("returns 429 once the per-IP budget is exhausted within a window", async () => {
    let last = new Response();
    for (let i = 0; i < limiter.capacity; i++) {
      last = await GET(demoRequest(IP));
    }
    expect(last.status).toBe(200);

    const blocked = await GET(demoRequest(IP));
    expect(blocked.status).toBe(429);

    const otherIp = await GET(demoRequest("198.51.100.7"));
    expect(otherIp.status).toBe(200);
  });
});