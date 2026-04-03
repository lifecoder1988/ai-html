// tests/codegen.test.ts
import { describe, it, expect } from "vitest";
import { generate } from "../src/codegen.js";
import { Node } from "../src/types.js";

function node(tag: string, overrides: Partial<Node> = {}): Node {
  return {
    tag,
    classes: [],
    atoms: [],
    macros: [],
    attrs: new Map(),
    pseudos: new Map(),
    children: [],
    ...overrides,
  };
}

describe("generate", () => {
  it("generates a simple div", () => {
    expect(generate([node("d")])).toBe("<div></div>");
  });

  it("generates self-closing tag", () => {
    expect(generate([node("m", { attrs: new Map([["s", "/img.jpg"]]) })])).toBe(
      '<img src="/img.jpg">'
    );
  });

  it("generates tag with text", () => {
    expect(generate([node("p", { text: "Hello" })])).toBe("<p>Hello</p>");
  });

  it("generates tag with id and classes", () => {
    const n = node("d", { id: "main", classes: ["foo", "bar"] });
    expect(generate([n])).toBe('<div id="main" class="foo bar"></div>');
  });

  it("generates tag with attributes", () => {
    const n = node("a", {
      attrs: new Map([["h", "/page"], ["tg", "_blank"]]),
      text: "Click",
    });
    expect(generate([n])).toBe('<a href="/page" target="_blank">Click</a>');
  });

  it("generates boolean attributes", () => {
    const n = node("i", {
      attrs: new Map([["t", "checkbox"], ["ck", ""], ["r", ""]]),
    });
    const html = generate([n]);
    expect(html).toContain("checked");
    expect(html).toContain("required");
  });

  it("generates inline styles from atoms", () => {
    const n = node("d", { atoms: ["F", "Ac"] });
    const html = generate([n]);
    expect(html).toContain('style="display:flex;align-items:center"');
  });

  it("expands macros into styles", () => {
    const n = node("d", { macros: ["%C"] });
    const html = generate([n]);
    expect(html).toContain("display:flex");
    expect(html).toContain("align-items:center");
    expect(html).toContain("justify-content:center");
  });

  it("atoms override macro styles (same property)", () => {
    // %C gives justify-content:center, Jb overrides to space-between
    const n = node("d", { macros: ["%C"], atoms: ["Jb"] });
    const html = generate([n]);
    expect(html).toContain("justify-content:space-between");
    expect(html).not.toContain("justify-content:center");
  });

  it("generates children", () => {
    const child = node("p", { text: "Hi" });
    const parent = node("d", { children: [child] });
    expect(generate([parent])).toBe("<div><p>Hi</p></div>");
  });

  it("generates raw style", () => {
    const n = node("d", { rawStyle: "transition:all .3s" });
    expect(generate([n])).toContain("transition:all .3s");
  });

  it("generates data attributes", () => {
    const n = node("d", { attrs: new Map([["@tooltip", "hello"]]) });
    expect(generate([n])).toContain('data-tooltip="hello"');
  });

  it("generates aria attributes", () => {
    const n = node("d", { attrs: new Map([["!label", "Close"], ["rl", "button"]]) });
    const html = generate([n]);
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('role="button"');
  });
});
