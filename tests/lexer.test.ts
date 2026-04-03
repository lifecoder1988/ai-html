// tests/lexer.test.ts
import { describe, it, expect } from "vitest";
import { tokenize } from "../src/lexer.js";
import { TokenType } from "../src/types.js";

describe("tokenize", () => {
  it("tokenizes a simple tag", () => {
    const tokens = tokenize("d");
    expect(tokens).toEqual([{ type: TokenType.TAG, value: "d" }]);
  });

  it("tokenizes tag with text", () => {
    const tokens = tokenize('p"Hello"');
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "p" },
      { type: TokenType.TEXT, value: "Hello" },
    ]);
  });

  it("tokenizes two-char tag", () => {
    const tokens = tokenize("h1");
    expect(tokens).toEqual([{ type: TokenType.TAG, value: "h1" }]);
  });

  it("tokenizes tag with class", () => {
    const tokens = tokenize("d.myclass");
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "d" },
      { type: TokenType.CLASS, value: "myclass" },
    ]);
  });

  it("tokenizes tag with id", () => {
    const tokens = tokenize("d#main");
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "d" },
      { type: TokenType.ID, value: "main" },
    ]);
  });

  it("tokenizes atom (uppercase after dot)", () => {
    const tokens = tokenize("d.F.Ac");
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "d" },
      { type: TokenType.ATOM, value: "F" },
      { type: TokenType.ATOM, value: "Ac" },
    ]);
  });

  it("tokenizes macro", () => {
    const tokens = tokenize("d.%C");
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "d" },
      { type: TokenType.MACRO, value: "%C" },
    ]);
  });

  it("tokenizes color atoms", () => {
    const tokens = tokenize("d.C#fff.Bg#1a1a2e");
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "d" },
      { type: TokenType.ATOM, value: "C#fff" },
      { type: TokenType.ATOM, value: "Bg#1a1a2e" },
    ]);
  });
});

describe("tokenize — structure operators", () => {
  it("tokenizes child operator", () => {
    const tokens = tokenize('d>p"Hi"');
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "d" },
      { type: TokenType.CHILD, value: ">" },
      { type: TokenType.TAG, value: "p" },
      { type: TokenType.TEXT, value: "Hi" },
    ]);
  });

  it("tokenizes sibling operator", () => {
    const tokens = tokenize('h1"A"+p"B"');
    expect(tokens).toEqual([
      { type: TokenType.TAG, value: "h1" },
      { type: TokenType.TEXT, value: "A" },
      { type: TokenType.SIBLING, value: "+" },
      { type: TokenType.TAG, value: "p" },
      { type: TokenType.TEXT, value: "B" },
    ]);
  });

  it("tokenizes grouping and multiply", () => {
    const tokens = tokenize('(l"item")*3');
    expect(tokens).toEqual([
      { type: TokenType.GROUP_OPEN, value: "(" },
      { type: TokenType.TAG, value: "l" },
      { type: TokenType.TEXT, value: "item" },
      { type: TokenType.GROUP_CLOSE, value: ")" },
      { type: TokenType.MULTIPLY, value: "3" },
    ]);
  });

  it("tokenizes attributes", () => {
    const tokens = tokenize("a[h=/page;tg=_blank]");
    expect(tokens).toContainEqual({ type: TokenType.ATTR_PAIR, value: "h=/page" });
    expect(tokens).toContainEqual({ type: TokenType.ATTR_PAIR, value: "tg=_blank" });
  });

  it("tokenizes boolean attributes", () => {
    const tokens = tokenize("i[t=checkbox;ck;r]");
    expect(tokens).toContainEqual({ type: TokenType.ATTR_PAIR, value: "t=checkbox" });
    expect(tokens).toContainEqual({ type: TokenType.ATTR_BOOL, value: "ck" });
    expect(tokens).toContainEqual({ type: TokenType.ATTR_BOOL, value: "r" });
  });

  it("tokenizes raw style", () => {
    const tokens = tokenize("d{transition:all .3s}");
    expect(tokens).toContainEqual({ type: TokenType.RAW_STYLE, value: "transition:all .3s" });
  });

  it("tokenizes pseudo-class", () => {
    const tokens = tokenize("d.Bg#fff:h{Bg#eee}");
    expect(tokens).toContainEqual({ type: TokenType.ATOM, value: "Bg#fff" });
    expect(tokens).toContainEqual({ type: TokenType.PSEUDO, value: "h:Bg#eee" });
  });

  it("tokenizes escaped text", () => {
    const tokens = tokenize('p"He said \\"hi\\""');
    expect(tokens).toContainEqual({ type: TokenType.TEXT, value: 'He said "hi"' });
  });

  it("tokenizes complex expression", () => {
    const tokens = tokenize('d.%C.P4>h1.Tb"Hello"+p.Ts.C#666"World"');
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      TokenType.TAG,       // d
      TokenType.MACRO,     // %C
      TokenType.ATOM,      // P4
      TokenType.CHILD,     // >
      TokenType.TAG,       // h1
      TokenType.ATOM,      // Tb
      TokenType.TEXT,       // Hello
      TokenType.SIBLING,   // +
      TokenType.TAG,       // p
      TokenType.ATOM,      // Ts
      TokenType.ATOM,      // C#666
      TokenType.TEXT,       // World
    ]);
  });
});
