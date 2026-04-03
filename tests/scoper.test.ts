// tests/scoper.test.ts
import { describe, it, expect } from "vitest";
import { generateScopedStyles, PSEUDO_MAP } from "../src/scoper.js";

describe("PSEUDO_MAP", () => {
  it("maps pseudo shortcodes", () => {
    expect(PSEUDO_MAP.get("h")).toBe("hover");
    expect(PSEUDO_MAP.get("f")).toBe("focus");
    expect(PSEUDO_MAP.get("a")).toBe("active");
    expect(PSEUDO_MAP.get("v")).toBe("visited");
    expect(PSEUDO_MAP.get("fc")).toBe("first-child");
    expect(PSEUDO_MAP.get("lc")).toBe("last-child");
  });
});

describe("generateScopedStyles", () => {
  it("generates scoped hover style", () => {
    const result = generateScopedStyles("aim-0", new Map([["h", ["Bg#eee"]]]));
    expect(result).toContain(".aim-0:hover");
    expect(result).toContain("background:#eee");
  });

  it("generates multiple pseudo-class styles", () => {
    const result = generateScopedStyles("aim-1", new Map([
      ["h", ["Bg#eee"]],
      ["f", ["B2", "Bc#00f"]],
    ]));
    expect(result).toContain(".aim-1:hover");
    expect(result).toContain(".aim-1:focus");
    expect(result).toContain("border:2px solid");
    expect(result).toContain("border-color:#00f");
  });
});
