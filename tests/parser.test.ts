// tests/parser.test.ts
import { describe, it, expect } from "vitest";
import { parse } from "../src/parser.js";
import { tokenize } from "../src/lexer.js";

function parseAim(input: string) {
  return parse(tokenize(input));
}

describe("parse", () => {
  it("parses a simple tag", () => {
    const nodes = parseAim("d");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].tag).toBe("d");
  });

  it("parses tag with text", () => {
    const nodes = parseAim('p"Hello"');
    expect(nodes[0].tag).toBe("p");
    expect(nodes[0].text).toBe("Hello");
  });

  it("parses tag with class", () => {
    const nodes = parseAim("d.myclass");
    expect(nodes[0].classes).toEqual(["myclass"]);
  });

  it("parses tag with id", () => {
    const nodes = parseAim("d#main");
    expect(nodes[0].id).toBe("main");
  });

  it("parses tag with atoms", () => {
    const nodes = parseAim("d.F.Ac");
    expect(nodes[0].atoms).toEqual(["F", "Ac"]);
  });

  it("parses tag with macros", () => {
    const nodes = parseAim("d.%C");
    expect(nodes[0].macros).toEqual(["%C"]);
  });

  it("parses child relationship", () => {
    const nodes = parseAim('d>p"Hi"');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].tag).toBe("d");
    expect(nodes[0].children).toHaveLength(1);
    expect(nodes[0].children[0].tag).toBe("p");
    expect(nodes[0].children[0].text).toBe("Hi");
  });

  it("parses sibling relationship", () => {
    const nodes = parseAim('h1"A"+p"B"');
    expect(nodes).toHaveLength(2);
    expect(nodes[0].tag).toBe("h1");
    expect(nodes[1].tag).toBe("p");
  });

  it("parses climb operator", () => {
    const nodes = parseAim('d>p"A"^s"B"');
    expect(nodes).toHaveLength(2);
    expect(nodes[0].tag).toBe("d");
    expect(nodes[0].children[0].tag).toBe("p");
    expect(nodes[1].tag).toBe("s");
  });

  it("parses grouping", () => {
    const nodes = parseAim('d>(h1"A"+p"B")');
    expect(nodes[0].children).toHaveLength(2);
    expect(nodes[0].children[0].tag).toBe("h1");
    expect(nodes[0].children[1].tag).toBe("p");
  });

  it("parses multiply", () => {
    const nodes = parseAim("l*3");
    expect(nodes).toHaveLength(3);
    nodes.forEach((n) => expect(n.tag).toBe("l"));
  });

  it("parses group multiply", () => {
    const nodes = parseAim('(d>p"X")*2');
    expect(nodes).toHaveLength(2);
    nodes.forEach((n) => {
      expect(n.tag).toBe("d");
      expect(n.children[0].text).toBe("X");
    });
  });

  it("parses attributes", () => {
    const nodes = parseAim("a[h=/page;tg=_blank]");
    expect(nodes[0].attrs.get("h")).toBe("/page");
    expect(nodes[0].attrs.get("tg")).toBe("_blank");
  });

  it("parses bare text node", () => {
    const nodes = parseAim('"just text"');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].tag).toBe("");
    expect(nodes[0].text).toBe("just text");
  });

  it("parses boolean attributes", () => {
    const nodes = parseAim("i[t=checkbox;ck;r]");
    expect(nodes[0].attrs.get("t")).toBe("checkbox");
    expect(nodes[0].attrs.get("ck")).toBe("");
    expect(nodes[0].attrs.get("r")).toBe("");
  });

  it("parses raw style", () => {
    const nodes = parseAim("d{transition:all .3s}");
    expect(nodes[0].rawStyle).toBe("transition:all .3s");
  });
});
