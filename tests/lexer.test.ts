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
