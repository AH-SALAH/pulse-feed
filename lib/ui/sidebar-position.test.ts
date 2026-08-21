import { describe, it, expect } from "vitest";
import {
  clampPosition,
  defaultPosition,
  parseStoredPosition,
  serializePosition,
  movePosition,
  type SidebarBounds,
  type SidebarPosition,
} from "./sidebar-position";

const bounds: SidebarBounds = {
  width: 72,
  height: 288,
  viewportWidth: 1280,
  viewportHeight: 800,
  margin: 16,
};

describe("clampPosition", () => {
  it("clamps x and y into the viewport minus margin", () => {
    expect(clampPosition({ x: -50, y: 900 }, bounds)).toEqual({ x: 16, y: 496 });
  });

  it("keeps values already inside bounds", () => {
    expect(clampPosition({ x: 24, y: 256 }, bounds)).toEqual({ x: 24, y: 256 });
  });

  it("clamps to the far edge when element exceeds viewport", () => {
    const tinyViewport: SidebarBounds = {
      width: 720,
      height: 300,
      viewportWidth: 400,
      viewportHeight: 200,
      margin: 8,
    };
    expect(clampPosition({ x: 0, y: 0 }, tinyViewport)).toEqual({ x: 8, y: 8 });
    expect(clampPosition({ x: 500, y: 500 }, tinyViewport)).toEqual({
      x: 8,
      y: 8,
    });
  });
});

describe("defaultPosition", () => {
  it("places the rail on the reading edge, vertically centered", () => {
    const expectedY = Math.round((800 - 288) / 2);
    expect(defaultPosition(bounds, "ltr")).toEqual({ x: 24, y: expectedY });
  });

  it("mirrors to the opposite edge in RTL", () => {
    const expectedY = Math.round((800 - 288) / 2);
    expect(defaultPosition(bounds, "rtl")).toEqual({
      x: 1280 - 72 - 24,
      y: expectedY,
    });
  });
});

describe("movePosition", () => {
  it("translates by the delta", () => {
    expect(movePosition({ x: 24, y: 256 }, 100, -40)).toEqual({
      x: 124,
      y: 216,
    });
  });
});

describe("serialize / parse round-trip", () => {
  it("round-trips a valid position", () => {
    const pos: SidebarPosition = { x: 120, y: 200 };
    expect(parseStoredPosition(serializePosition(pos))).toEqual(pos);
  });

  it("returns null for garbage", () => {
    expect(parseStoredPosition("not json")).toBeNull();
    expect(parseStoredPosition(null)).toBeNull();
    expect(parseStoredPosition('{"x":"a","y":1}')).toBeNull();
    expect(parseStoredPosition("{}")).toBeNull();
  });
});