import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateUserLocale } from "./locale";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: vi.fn(),
    },
  },
}));

describe("updateUserLocale", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists the locale and returns it when valid", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await expect(updateUserLocale("user_1", "ar")).resolves.toBe("ar");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { locale: "ar" },
    });
  });

  it("rejects with INVALID_LOCALE when the locale is not supported", async () => {
    await expect(updateUserLocale("user_1", "fr")).rejects.toThrow(
      "INVALID_LOCALE",
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});