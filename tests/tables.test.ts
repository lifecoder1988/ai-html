import { describe, it, expect } from "vitest";
import { TAG_MAP } from "../src/tables/tags.js";
import { ATTR_MAP, BOOL_ATTRS } from "../src/tables/attrs.js";
import { resolveAtom } from "../src/tables/atoms.js";

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

describe("ATTR_MAP", () => {
  it("maps attribute shortcodes", () => {
    expect(ATTR_MAP.get("h")).toBe("href");
    expect(ATTR_MAP.get("s")).toBe("src");
    expect(ATTR_MAP.get("t")).toBe("type");
    expect(ATTR_MAP.get("n")).toBe("name");
    expect(ATTR_MAP.get("v")).toBe("value");
    expect(ATTR_MAP.get("p")).toBe("placeholder");
    expect(ATTR_MAP.get("a")).toBe("alt");
    expect(ATTR_MAP.get("tg")).toBe("target");
    expect(ATTR_MAP.get("rl")).toBe("role");
  });

  it("treats unknown codes as literal attribute names", () => {
    expect(ATTR_MAP.get("onclick")).toBeUndefined();
  });
});

describe("BOOL_ATTRS", () => {
  it("contains boolean attribute codes", () => {
    expect(BOOL_ATTRS.has("r")).toBe(true);
    expect(BOOL_ATTRS.has("di")).toBe(true);
    expect(BOOL_ATTRS.has("ck")).toBe(true);
    expect(BOOL_ATTRS.has("ro")).toBe(true);
  });
});

describe("resolveAtom", () => {
  it("resolves layout atoms", () => {
    expect(resolveAtom("F")).toBe("display:flex");
    expect(resolveAtom("Fc")).toBe("flex-direction:column");
    expect(resolveAtom("G")).toBe("display:grid");
    expect(resolveAtom("Gc3")).toBe("grid-template-columns:repeat(3,1fr)");
    expect(resolveAtom("Dn")).toBe("display:none");
  });

  it("resolves alignment atoms", () => {
    expect(resolveAtom("Ac")).toBe("align-items:center");
    expect(resolveAtom("Jb")).toBe("justify-content:space-between");
  });

  it("resolves spacing atoms with numeric values", () => {
    expect(resolveAtom("P4")).toBe("padding:1rem");
    expect(resolveAtom("P0")).toBe("padding:0");
    expect(resolveAtom("M8")).toBe("margin:2rem");
    expect(resolveAtom("Px4")).toBe("padding-left:1rem;padding-right:1rem");
    expect(resolveAtom("My2")).toBe("margin-top:0.5rem;margin-bottom:0.5rem");
    expect(resolveAtom("Ma")).toBe("margin:auto");
  });

  it("resolves sizing atoms", () => {
    expect(resolveAtom("W1")).toBe("width:100%");
    expect(resolveAtom("H1")).toBe("height:100%");
    expect(resolveAtom("Hs")).toBe("height:100vh");
    expect(resolveAtom("Xw800")).toBe("max-width:800px");
    expect(resolveAtom("Xw50p")).toBe("max-width:50%");
    expect(resolveAtom("Xh5r")).toBe("max-height:5rem");
  });

  it("resolves typography atoms", () => {
    expect(resolveAtom("Tb")).toBe("font-weight:bold");
    expect(resolveAtom("Tc")).toBe("text-align:center");
    expect(resolveAtom("Ts")).toBe("font-size:0.875rem");
    expect(resolveAtom("T2x")).toBe("font-size:2rem");
  });

  it("resolves color atoms", () => {
    expect(resolveAtom("C#fff")).toBe("color:#fff");
    expect(resolveAtom("Bg#1a1a2e")).toBe("background:#1a1a2e");
    expect(resolveAtom("Bc#ccc")).toBe("border-color:#ccc");
  });

  it("resolves border and radius atoms", () => {
    expect(resolveAtom("B1")).toBe("border:1px solid");
    expect(resolveAtom("Br4")).toBe("border-radius:1rem");
    expect(resolveAtom("Brf")).toBe("border-radius:9999px");
  });

  it("resolves positioning atoms", () => {
    expect(resolveAtom("Qr")).toBe("position:relative");
    expect(resolveAtom("Qa")).toBe("position:absolute");
    expect(resolveAtom("Z10")).toBe("z-index:10");
    expect(resolveAtom("T0")).toBe("top:0");
    expect(resolveAtom("L2r")).toBe("left:2rem");
  });

  it("resolves gap atoms", () => {
    expect(resolveAtom("Gp4")).toBe("gap:1rem");
    expect(resolveAtom("Gp6")).toBe("gap:1.5rem");
  });

  it("resolves misc atoms", () => {
    expect(resolveAtom("Oh")).toBe("overflow:hidden");
    expect(resolveAtom("Cu")).toBe("cursor:pointer");
    expect(resolveAtom("Sh")).toContain("box-shadow:");
  });

  it("returns null for unknown atoms", () => {
    expect(resolveAtom("Zz")).toBeNull();
  });
});
