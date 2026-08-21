import { describe, it, expect, vi, beforeEach } from "vitest";
import { getServerSession } from "./session";
import { auth } from "./config";

vi.mock("./config", () => ({
  auth: {
    api: {
      getSession: vi.fn(
        async ({ headers }: { headers: Headers }) => {
          const cookie = headers.get("cookie") ?? "";
          if (!cookie.includes("better-auth.session_token")) {
            return null;
          }
          return {
            session: { id: "sess_1" },
            user: { id: "user_123", email: "a@example.com" },
          };
        },
      ),
    },
  },
}));

describe("getServerSession", () => {
  beforeEach(() => {
    vi.mocked(auth.api.getSession).mockClear();
  });

  it("returns null for a request with no session cookie", async () => {
    const req = new Request("http://localhost:3000/api/boards/me");
    const session = await getServerSession(req);
    expect(session).toBeNull();
  });

  it("returns the expected user id for a request with a valid session cookie", async () => {
    const req = new Request("http://localhost:3000/api/boards/me", {
      headers: { cookie: "better-auth.session_token=valid-token" },
    });
    const session = await getServerSession(req);
    expect(session).not.toBeNull();
    expect(session?.user.id).toBe("user_123");
  });
});