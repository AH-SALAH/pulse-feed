import { getPublicDemoBoard } from "@/lib/boards/service";
import { TokenBucket } from "@/lib/rate-limit/token-bucket";

// Known single-instance limitation: this limiter lives in process memory, so it
// only applies per server instance. Upgrade path for multi-instance deploys is
// an external store (e.g. Upstash Redis), mirroring the shared DevGraph pattern.
const RATE_LIMIT_CAPACITY = 30;
const RATE_LIMIT_REFILL = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;

export const limiter = new TokenBucket(
  RATE_LIMIT_CAPACITY,
  RATE_LIMIT_REFILL,
  RATE_LIMIT_WINDOW_MS,
);

export async function GET(request: Request): Promise<Response> {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded?.split(",")[0]?.trim() ?? "unknown").replace(
    /^::ffff:/,
    "",
  );

  if (!limiter.allow(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  return Response.json({ widgets: getPublicDemoBoard() });
}