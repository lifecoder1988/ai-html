import { describe, it, expect } from "vitest";
import { TAG_MAP } from "../src/tables/tags.js";

describe("TAG_MAP", () => {
  it("maps single-char tags", () => {
    expect(TAG_MAP.get("d")).toBe("div");
    expect(TAG_MAP.get("s")).toBe("span");
    expect(TAG_MAP.get("p")).toBe("p");
    expect(TAG_MAP.get("a")).toBe("a");
    expect(TAG_MAP.get("b")).toBe("button");
    expect(TAG_MAP.get("i")).toBe("input");
    expect(TAG_MAP.get("m")).toBe("img");
    expect(TAG_MAP.get("n")).toBe("nav");
    expect(TAG_MAP.get("f")).toBe("form");
    expect(TAG_MAP.get("u")).toBe("ul");
    expect(TAG_MAP.get("o")).toBe("ol");
    expect(TAG_MAP.get("l")).toBe("li");
    expect(TAG_MAP.get("t")).toBe("table");
    expect(TAG_MAP.get("h")).toBe("header");
    expect(TAG_MAP.get("e")).toBe("select");
    expect(TAG_MAP.get("x")).toBe("textarea");
  });

  it("maps two-char tags", () => {
    expect(TAG_MAP.get("h1")).toBe("h1");
    expect(TAG_MAP.get("h6")).toBe("h6");
    expect(TAG_MAP.get("sc")).toBe("section");
    expect(TAG_MAP.get("ar")).toBe("article");
    expect(TAG_MAP.get("mn")).toBe("main");
    expect(TAG_MAP.get("ft")).toBe("footer");
    expect(TAG_MAP.get("bl")).toBe("blockquote");
    expect(TAG_MAP.get("sv")).toBe("svg");
    expect(TAG_MAP.get("tb")).toBe("tbody");
    expect(TAG_MAP.get("tt")).toBe("thead");
  });

  it("maps document-level tags", () => {
    expect(TAG_MAP.get("ht")).toBe("html");
    expect(TAG_MAP.get("hd")).toBe("head");
    expect(TAG_MAP.get("bd")).toBe("body");
    expect(TAG_MAP.get("ti")).toBe("title");
    expect(TAG_MAP.get("mt")).toBe("meta");
    expect(TAG_MAP.get("lk")).toBe("link");
    expect(TAG_MAP.get("js")).toBe("script");
    expect(TAG_MAP.get("sy")).toBe("style");
  });

  it("returns undefined for unknown codes", () => {
    expect(TAG_MAP.get("zz")).toBeUndefined();
  });
});
