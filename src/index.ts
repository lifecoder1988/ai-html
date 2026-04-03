// src/index.ts
import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { generate } from "./codegen.js";

export function compile(aim: string): string {
  const tokens = tokenize(aim);
  const ast = parse(tokens);
  return generate(ast);
}
