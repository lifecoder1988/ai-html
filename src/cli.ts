// src/cli.ts
import { readFileSync, writeFileSync } from "node:fs";
import { compile } from "./index.js";

const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`aimc - AIM Compiler

Usage:
  aimc <input.aim> [-o output.html]  Compile AIM to HTML
  aimc -e "<aim expression>"         Compile inline expression

Options:
  -o <file>   Write output to file (default: stdout)
  -e <expr>   Compile expression from argument
  --wrap      Wrap output in HTML document shell
  -h, --help  Show this help`);
  process.exit(0);
}

let input: string | undefined = undefined;
let outputFile: string | null = null;
let wrap = false;

// Parse args
let i = 0;
while (i < args.length) {
  if (args[i] === "-o" && i + 1 < args.length) {
    outputFile = args[++i];
  } else if (args[i] === "-e" && i + 1 < args.length) {
    input = args[++i];
  } else if (args[i] === "--wrap") {
    wrap = true;
  } else if (!input) {
    input = readFileSync(args[i], "utf-8");
  }
  i++;
}

if (!input) {
  console.error("Error: No input provided");
  process.exit(1);
}

let html = compile(input);

if (wrap) {
  html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body>${html}</body>
</html>`;
}

if (outputFile) {
  writeFileSync(outputFile, html);
  console.log(`Written to ${outputFile}`);
} else {
  console.log(html);
}
