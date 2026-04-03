// src/lexer.ts
import { Token, TokenType } from "./types.js";
import { TAG_MAP } from "./tables/tags.js";

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    // Skip whitespace/newlines
    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      i++;
      continue;
    }

    // Structure operators
    if (ch === ">") { tokens.push({ type: TokenType.CHILD, value: ">" }); i++; continue; }
    if (ch === "+") { tokens.push({ type: TokenType.SIBLING, value: "+" }); i++; continue; }
    if (ch === "^") { tokens.push({ type: TokenType.CLIMB, value: "^" }); i++; continue; }
    if (ch === "(") { tokens.push({ type: TokenType.GROUP_OPEN, value: "(" }); i++; continue; }
    if (ch === ")") { tokens.push({ type: TokenType.GROUP_CLOSE, value: ")" }); i++; continue; }

    // Multiply
    if (ch === "*") {
      i++;
      let num = "";
      while (i < input.length && input[i] >= "0" && input[i] <= "9") {
        num += input[i++];
      }
      tokens.push({ type: TokenType.MULTIPLY, value: num });
      continue;
    }

    // Text
    if (ch === '"') {
      i++; // skip opening quote
      let text = "";
      while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\" && i + 1 < input.length) {
          text += input[i + 1];
          i += 2;
        } else {
          text += input[i++];
        }
      }
      i++; // skip closing quote
      tokens.push({ type: TokenType.TEXT, value: text });
      continue;
    }

    // Attributes
    if (ch === "[") {
      tokens.push({ type: TokenType.ATTR_OPEN, value: "[" });
      i++;
      // Parse attribute pairs until ]
      while (i < input.length && input[i] !== "]") {
        if (input[i] === ";") { i++; continue; }
        // Read key
        let key = "";
        while (i < input.length && input[i] !== "=" && input[i] !== ";" && input[i] !== "]") {
          key += input[i++];
        }
        if (i < input.length && input[i] === "=") {
          i++; // skip =
          let val = "";
          while (i < input.length && input[i] !== ";" && input[i] !== "]") {
            val += input[i++];
          }
          tokens.push({ type: TokenType.ATTR_PAIR, value: `${key}=${val}` });
        } else {
          // Boolean attribute
          tokens.push({ type: TokenType.ATTR_BOOL, value: key });
        }
      }
      if (i < input.length) i++; // skip ]
      tokens.push({ type: TokenType.ATTR_CLOSE, value: "]" });
      continue;
    }

    // Raw style or pseudo-class (check for : before {)
    if (ch === "{") {
      i++; // skip {
      let raw = "";
      let depth = 1;
      while (i < input.length && depth > 0) {
        if (input[i] === "{") depth++;
        if (input[i] === "}") depth--;
        if (depth > 0) raw += input[i];
        i++;
      }
      tokens.push({ type: TokenType.RAW_STYLE, value: raw });
      continue;
    }

    // Dot: class, atom, or macro
    if (ch === ".") {
      i++; // skip dot
      // Macro: starts with %
      if (i < input.length && input[i] === "%") {
        i++; // skip %
        let name = "";
        while (i < input.length && /[a-zA-Z0-9]/.test(input[i])) {
          name += input[i++];
        }
        tokens.push({ type: TokenType.MACRO, value: `%${name}` });
        continue;
      }
      // Read the identifier after dot
      let ident = "";
      while (i < input.length && /[a-zA-Z0-9#_-]/.test(input[i])) {
        ident += input[i++];
      }
      if (ident.length === 0) continue;
      // Uppercase first char = atom, lowercase = class
      if (ident[0] >= "A" && ident[0] <= "Z") {
        tokens.push({ type: TokenType.ATOM, value: ident });
      } else {
        tokens.push({ type: TokenType.CLASS, value: ident });
      }
      continue;
    }

    // ID: #
    if (ch === "#") {
      i++; // skip #
      let id = "";
      while (i < input.length && /[a-zA-Z0-9_-]/.test(input[i])) {
        id += input[i++];
      }
      tokens.push({ type: TokenType.ID, value: id });
      continue;
    }

    // Pseudo-class: : followed by shortcode then { ... }
    if (ch === ":") {
      i++; // skip :
      let pseudo = "";
      while (i < input.length && input[i] !== "{" && /[a-zA-Z]/.test(input[i])) {
        pseudo += input[i++];
      }
      if (i < input.length && input[i] === "{") {
        i++; // skip {
        let body = "";
        let depth = 1;
        while (i < input.length && depth > 0) {
          if (input[i] === "{") depth++;
          if (input[i] === "}") depth--;
          if (depth > 0) body += input[i];
          i++;
        }
        tokens.push({ type: TokenType.PSEUDO, value: `${pseudo}:${body}` });
      }
      continue;
    }

    // Tag: try longest match (2-char first, then 1-char)
    // h1-h6 are in TAG_MAP so the 2-char branch catches them
    if (/[a-z]/.test(ch)) {
      // Try 2-char
      const two = input.slice(i, i + 2);
      if (two.length === 2 && TAG_MAP.has(two)) {
        tokens.push({ type: TokenType.TAG, value: two });
        i += 2;
        continue;
      }
      // Try 1-char
      if (TAG_MAP.has(ch)) {
        tokens.push({ type: TokenType.TAG, value: ch });
        i++;
        continue;
      }
      // Unknown — skip
      i++;
      continue;
    }

    // Unknown character — skip
    i++;
  }

  return tokens;
}
