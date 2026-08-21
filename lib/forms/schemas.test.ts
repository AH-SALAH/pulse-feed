import { describe, it, expect } from "vitest";
import { addWidgetSchema, signInSchema, signUpSchema } from "./schemas";

describe("signInSchema", () => {
  it("accepts a valid email and password", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email with the translated error key", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.emailInvalid");
    }
  });

  it("rejects a missing email with the required key", () => {
    const result = signInSchema.safeParse({
      email: "",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.emailRequired");
    }
  });

  it("rejects a missing password with the required key", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "auth.errors.passwordRequired",
      );
    }
  });

  it("rejects a short password with the min-length key", () => {
    const result = signInSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.passwordMin");
    }
  });
});

describe("signUpSchema", () => {
  it("accepts a valid name, email, and password", () => {
    const result = signUpSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing name with the required key", () => {
    const result = signUpSchema.safeParse({
      name: "   ",
      email: "ada@example.com",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.nameRequired");
    }
  });

  it("rejects an overlong name with the too-long key", () => {
    const result = signUpSchema.safeParse({
      name: "x".repeat(51),
      email: "ada@example.com",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.nameTooLong");
    }
  });

  it("rejects an invalid email with the translated error key", () => {
    const result = signUpSchema.safeParse({
      name: "Ada",
      email: "not-an-email",
      password: "Str0ng-P@ss",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.emailInvalid");
    }
  });

  it("rejects a short password with the min-length key", () => {
    const result = signUpSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("auth.errors.passwordMin");
    }
  });
});

describe("addWidgetSchema", () => {
  it("accepts a non-empty symbol", () => {
    const result = addWidgetSchema.safeParse({ symbol: "ADAUSDT" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty symbol with the required key", () => {
    const result = addWidgetSchema.safeParse({ symbol: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("board.errors.symbolRequired");
    }
  });
});
