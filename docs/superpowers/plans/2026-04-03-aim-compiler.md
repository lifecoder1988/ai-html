# AIM Compiler Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `aimc`, a compiler that transpiles AIM markup into HTML+CSS.

**Architecture:** A classic compiler pipeline — Lexer → Parser → AST → CodeGen. Each stage is a pure function that takes input and returns output, making them independently testable. Lookup tables (tags, attributes, atoms, macros) are separate data modules consumed by lexer and codegen.

**Tech Stack:** TypeScript, Node.js, Vitest for testing, `tsup` for bundling the CLI.

**Spec:** `docs/superpowers/specs/2026-04-03-aim-language-design.md`

---

## File Structure

```
src/
  index.ts              # Public API: compile(aim: string): string
  cli.ts                # CLI entry point (aimc command)
  lexer.ts              # Tokenizer: AIM string → Token[]
  parser.ts             # Parser: Token[] → AST (Node tree)
  codegen.ts            # Code generator: AST → HTML string
  types.ts              # Shared types: Token, TokenType, Node
  tables/
    tags.ts             # Tag code → HTML tag name mapping
    attrs.ts            # Attribute code → attribute name mapping
    atoms.ts            # Atomic style code → CSS declaration mapping
    macros.ts           # Macro code → atom[] expansion mapping
  scoper.ts             # Pseudo-class scoped style generator
tests/
  lexer.test.ts
  parser.test.ts
  codegen.test.ts
  scoper.test.ts
  integration.test.ts   # Full pipeline: AIM → HTML
  tables.test.ts
package.json
tsconfig.json
vitest.config.ts
```

---

## Chunk 1: Project Setup & Lookup Tables

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Initialize project**

```bash
cd /Users/joe/code/ai-html
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install -D typescript vitest tsup @types/node
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Update package.json scripts**

Add to `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "tsup src/cli.ts --format esm --dts",
    "aimc": "npx tsx src/cli.ts"
  },
  "bin": {
    "aimc": "./dist/cli.js"
  }
}
```

- [ ] **Step 6: Create src/types.ts**

```ts
export enum TokenType {
  TAG = "TAG",
  CLASS = "CLASS",
  ID = "ID",
  ATOM = "ATOM",
  MACRO = "MACRO",
  ATTR_OPEN = "ATTR_OPEN",
  ATTR_CLOSE = "ATTR_CLOSE",
  ATTR_PAIR = "ATTR_PAIR",
  ATTR_BOOL = "ATTR_BOOL",
  TEXT = "TEXT",
  CHILD = "CHILD",
  SIBLING = "SIBLING",
  CLIMB = "CLIMB",
  GROUP_OPEN = "GROUP_OPEN",
  GROUP_CLOSE = "GROUP_CLOSE",
  MULTIPLY = "MULTIPLY",
  RAW_STYLE = "RAW_STYLE",
  PSEUDO = "PSEUDO",
}

export interface Token {
  type: TokenType;
  value: string;
}

export interface Node {
  tag: string;
  id?: string;
  classes: string[];
  atoms: string[];
  macros: string[];
  attrs: Map<string, string>;
  rawStyle?: string;
  pseudos: Map<string, string[]>; // e.g. "h" → ["Bg#eee"]
  text?: string;
  children: Node[];
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding with TypeScript, Vitest, types"
```

---

### Task 2: Tag lookup table

**Files:**
- Create: `src/tables/tags.ts`
- Create: `tests/tables.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/tables.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/tables.test.ts`
Expected: FAIL — cannot find module `../src/tables/tags.js`

- [ ] **Step 3: Write implementation**

```ts
// src/tables/tags.ts
export const TAG_MAP = new Map<string, string>([
  // Single-character
  ["d", "div"], ["s", "span"], ["p", "p"], ["a", "a"],
  ["b", "button"], ["i", "input"], ["f", "form"], ["n", "nav"],
  ["m", "img"], ["u", "ul"], ["o", "ol"], ["l", "li"],
  ["t", "table"], ["h", "header"], ["e", "select"], ["x", "textarea"],
  // h1-h6
  ["h1", "h1"], ["h2", "h2"], ["h3", "h3"],
  ["h4", "h4"], ["h5", "h5"], ["h6", "h6"],
  // Two-character
  ["tr", "tr"], ["td", "td"], ["th", "th"],
  ["sc", "section"], ["ar", "article"], ["mn", "main"], ["ft", "footer"],
  ["fg", "figure"], ["fc", "figcaption"],
  ["dl", "details"], ["sm", "summary"], ["dg", "dialog"],
  ["vd", "video"], ["ad", "audio"], ["sr", "source"],
  ["em", "em"], ["st", "strong"], ["cd", "code"],
  ["pr", "pre"], ["bl", "blockquote"],
  ["hr", "hr"], ["br", "br"],
  ["la", "label"], ["op", "option"], ["og", "optgroup"],
  ["fs", "fieldset"], ["lg", "legend"],
  ["if", "iframe"], ["sv", "svg"], ["cn", "canvas"], ["pt", "path"],
  ["tb", "tbody"], ["tt", "thead"], ["tf", "tfoot"],
  ["cp", "caption"], ["cg", "colgroup"], ["co", "col"],
  // Document-level
  ["ht", "html"], ["hd", "head"], ["bd", "body"],
  ["ti", "title"], ["mt", "meta"], ["lk", "link"],
  ["js", "script"], ["sy", "style"],
]);

// Set of self-closing (void) HTML elements
export const VOID_TAGS = new Set([
  "img", "input", "br", "hr", "meta", "link", "col", "source",
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/tables.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tables/tags.ts tests/tables.test.ts
git commit -m "feat: add tag lookup table with tests"
```

---

### Task 3: Attribute lookup table

**Files:**
- Create: `src/tables/attrs.ts`
- Modify: `tests/tables.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/tables.test.ts`:

```ts
import { ATTR_MAP, BOOL_ATTRS } from "../src/tables/attrs.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/tables.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/tables/attrs.ts
export const ATTR_MAP = new Map<string, string>([
  ["h", "href"], ["s", "src"], ["t", "type"],
  ["n", "name"], ["v", "value"], ["p", "placeholder"],
  ["a", "alt"], ["w", "width"], ["ht", "height"],
  ["tg", "target"], ["ac", "action"], ["mt", "method"],
  ["mn", "min"], ["mx", "max"], ["ro", "readonly"],
  ["rl", "role"],
  // Boolean attrs also have name mappings
  ["r", "required"], ["di", "disabled"], ["ck", "checked"],
]);

export const BOOL_ATTRS = new Set(["r", "di", "ck", "ro"]);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/tables.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tables/attrs.ts tests/tables.test.ts
git commit -m "feat: add attribute lookup table with tests"
```

---

### Task 4: Atomic style lookup table

**Files:**
- Create: `src/tables/atoms.ts`
- Modify: `tests/tables.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/tables.test.ts`:

```ts
import { resolveAtom } from "../src/tables/atoms.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/tables.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/tables/atoms.ts

// Static 1:1 mappings
const STATIC: Map<string, string> = new Map([
  // Layout
  ["F", "display:flex"], ["Fc", "flex-direction:column"],
  ["Fr", "flex-direction:row"], ["Fw", "flex-wrap:wrap"],
  ["F1", "flex:1"], ["Fs0", "flex-shrink:0"],
  ["G", "display:grid"],
  ["Gc2", "grid-template-columns:repeat(2,1fr)"],
  ["Gc3", "grid-template-columns:repeat(3,1fr)"],
  ["Gc4", "grid-template-columns:repeat(4,1fr)"],
  ["Db", "display:block"], ["Di", "display:inline"],
  ["Dib", "display:inline-block"], ["Dn", "display:none"],
  // Alignment
  ["Ac", "align-items:center"], ["As", "align-items:flex-start"],
  ["Ae", "align-items:flex-end"], ["Ax", "align-items:stretch"],
  ["Jc", "justify-content:center"], ["Js", "justify-content:flex-start"],
  ["Je", "justify-content:flex-end"], ["Jb", "justify-content:space-between"],
  ["Ja", "justify-content:space-around"],
  // Sizing
  ["W1", "width:100%"], ["W2", "width:50%"],
  ["Wf", "width:fit-content"], ["Ws", "width:100vw"],
  ["H1", "height:100%"], ["Hs", "height:100vh"],
  // Typography
  ["Tb", "font-weight:bold"], ["Ti", "font-style:italic"],
  ["Tc", "text-align:center"], ["Tr", "text-align:right"],
  ["Tu", "text-decoration:underline"], ["Tn", "text-decoration:none"],
  ["Ts", "font-size:0.875rem"], ["Tl", "font-size:1.25rem"],
  ["Tx", "font-size:1.5rem"], ["T2x", "font-size:2rem"],
  // Borders
  ["B1", "border:1px solid"], ["B2", "border:2px solid"], ["Bn", "border:none"],
  ["Br2", "border-radius:0.5rem"], ["Br4", "border-radius:1rem"],
  ["Brf", "border-radius:9999px"],
  // Positioning
  ["Qr", "position:relative"], ["Qa", "position:absolute"],
  ["Qf", "position:fixed"], ["Qs", "position:sticky"],
  // Misc
  ["Oh", "overflow:hidden"], ["Oa", "overflow:auto"], ["Os", "overflow:scroll"],
  ["Cu", "cursor:pointer"],
  ["Sh", "box-shadow:0 2px 4px rgba(0,0,0,0.1)"],
  // Margin auto
  ["Ma", "margin:auto"],
]);

/** Parse a value suffix: bare number=px, p=percent, r=rem */
function parseValue(raw: string): string {
  if (raw.endsWith("p")) return raw.slice(0, -1) + "%";
  if (raw.endsWith("r")) return raw.slice(0, -1) + "rem";
  return raw + "px";
}

/** Convert spacing number to rem string (N * 0.25rem) */
function spacingRem(n: number): string {
  if (n === 0) return "0";
  const rem = n * 0.25;
  return rem % 1 === 0 ? `${rem}rem` : `${rem}rem`;
}

export function resolveAtom(code: string): string | null {
  // Static lookup first
  const s = STATIC.get(code);
  if (s) return s;

  // Padding: P0-P16, Px, Py, Pt, Pb, Pl, Pr + number
  const padMatch = code.match(/^P([xytblr]?)(\d+)$/);
  if (padMatch) {
    const [, axis, num] = padMatch;
    const val = spacingRem(parseInt(num));
    if (!axis) return `padding:${val}`;
    if (axis === "x") return `padding-left:${val};padding-right:${val}`;
    if (axis === "y") return `padding-top:${val};padding-bottom:${val}`;
    if (axis === "t") return `padding-top:${val}`;
    if (axis === "b") return `padding-bottom:${val}`;
    if (axis === "l") return `padding-left:${val}`;
    if (axis === "r") return `padding-right:${val}`;
  }

  // Margin: M0-M16, Mx, My, Mt, Mb, Ml, Mr + number
  const marMatch = code.match(/^M([xytblr]?)(\d+)$/);
  if (marMatch) {
    const [, axis, num] = marMatch;
    const val = spacingRem(parseInt(num));
    if (!axis) return `margin:${val}`;
    if (axis === "x") return `margin-left:${val};margin-right:${val}`;
    if (axis === "y") return `margin-top:${val};margin-bottom:${val}`;
    if (axis === "t") return `margin-top:${val}`;
    if (axis === "b") return `margin-bottom:${val}`;
    if (axis === "l") return `margin-left:${val}`;
    if (axis === "r") return `margin-right:${val}`;
  }

  // Gap: Gp2-Gp16
  const gapMatch = code.match(/^Gp(\d+)$/);
  if (gapMatch) return `gap:${spacingRem(parseInt(gapMatch[1]))}`;

  // Z-index: Z1-Z50
  const zMatch = code.match(/^Z(\d+)$/);
  if (zMatch) return `z-index:${zMatch[1]}`;

  // Opacity: Op + number (0-10, divided by 10)
  const opMatch = code.match(/^Op(\d+)$/);
  if (opMatch) return `opacity:${parseInt(opMatch[1]) / 10}`;

  // Max-width/height: Xw, Xh + value
  const xMatch = code.match(/^X([wh])(.+)$/);
  if (xMatch) {
    const prop = xMatch[1] === "w" ? "max-width" : "max-height";
    return `${prop}:${parseValue(xMatch[2])}`;
  }

  // Position offsets: T, R, B, L + value
  const offMatch = code.match(/^([TRBL])(\d.*)$/);
  if (offMatch) {
    const propMap: Record<string, string> = { T: "top", R: "right", B: "bottom", L: "left" };
    const prop = propMap[offMatch[1]];
    const val = offMatch[2] === "0" ? "0" : parseValue(offMatch[2]);
    return `${prop}:${val}`;
  }

  // Colors: C#, Bg#, Bc#
  const colorMatch = code.match(/^(C|Bg|Bc)(#[0-9a-fA-F]{3,8})$/);
  if (colorMatch) {
    const propMap: Record<string, string> = { C: "color", Bg: "background", Bc: "border-color" };
    return `${propMap[colorMatch[1]]}:${colorMatch[2]}`;
  }

  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/tables.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tables/atoms.ts tests/tables.test.ts
git commit -m "feat: add atomic style resolver with tests"
```

---

### Task 5: Macro lookup table

**Files:**
- Create: `src/tables/macros.ts`
- Modify: `tests/tables.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/tables.test.ts`:

```ts
import { MACRO_MAP } from "../src/tables/macros.js";

describe("MACRO_MAP", () => {
  it("contains all macros", () => {
    expect(MACRO_MAP.has("%C")).toBe(true);
    expect(MACRO_MAP.has("%R")).toBe(true);
    expect(MACRO_MAP.has("%Col")).toBe(true);
    expect(MACRO_MAP.has("%K")).toBe(true);
    expect(MACRO_MAP.has("%B")).toBe(true);
    expect(MACRO_MAP.has("%I")).toBe(true);
    expect(MACRO_MAP.has("%O")).toBe(true);
    expect(MACRO_MAP.has("%T")).toBe(true);
  });

  it("expands %C to centered flex atoms", () => {
    expect(MACRO_MAP.get("%C")).toEqual(["F", "Ac", "Jc"]);
  });

  it("expands %K to card atoms", () => {
    expect(MACRO_MAP.get("%K")).toEqual(["W1", "Br4", "Sh", "P4"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/tables.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/tables/macros.ts
export const MACRO_MAP = new Map<string, string[]>([
  ["%C", ["F", "Ac", "Jc"]],
  ["%R", ["F", "Ac", "Jb"]],
  ["%Col", ["F", "Fc"]],
  ["%K", ["W1", "Br4", "Sh", "P4"]],
  ["%B", ["Dib", "P2", "Px4", "Bg#3b82f6", "C#fff", "Br2", "Cu"]],
  ["%I", ["W1", "P2", "B1", "Bc#ccc", "Br2"]],
  ["%O", ["Qa", "W1", "H1"]],
  ["%T", ["Tn", "C#inherit"]],
]);
```

Note: `C#inherit` is not a hex color — `resolveAtom` won't match it via the `#[0-9a-fA-F]` regex. We need to handle `C` + non-hex as `color:<value>`. Update `resolveAtom` color pattern in Task 4's implementation to also accept `inherit`, `transparent`, etc.:

Change the color regex in `src/tables/atoms.ts` to accept hex values and CSS color keywords (2+ chars to avoid collisions with other atom prefixes like `Cu`):

```ts
// Colors: C#hex or C + css keyword (2+ chars), Bg#hex or Bg + keyword, Bc# or Bc + keyword
const colorMatch = code.match(/^(C|Bg|Bc)(#[0-9a-fA-F]{3,8}|[a-z]{2,})$/);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/tables.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/tables/macros.ts tests/tables.test.ts src/tables/atoms.ts
git commit -m "feat: add macro lookup table with tests"
```

---

## Chunk 2: Lexer

### Task 6: Lexer — basic element tokenization

**Files:**
- Create: `src/lexer.ts`
- Create: `tests/lexer.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/lexer.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/lexer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lexer.ts tests/lexer.test.ts
git commit -m "feat: add lexer with basic element tokenization"
```

---

### Task 7: Lexer — structure and edge cases

**Files:**
- Modify: `tests/lexer.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/lexer.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it passes (lexer already handles these)**

Run: `npm test -- tests/lexer.test.ts`
Expected: PASS (if not, fix the lexer bugs revealed)

- [ ] **Step 3: Fix any failures, then commit**

```bash
git add tests/lexer.test.ts
git commit -m "test: add lexer structure and edge case tests"
```

---

## Chunk 3: Parser

### Task 8: Parser — basic tree building

**Files:**
- Create: `src/parser.ts`
- Create: `tests/parser.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/parser.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/parser.ts
import { Token, TokenType, Node } from "./types.js";

function createNode(tag: string): Node {
  return {
    tag,
    classes: [],
    atoms: [],
    macros: [],
    attrs: new Map(),
    pseudos: new Map(),
    children: [],
  };
}

function cloneNode(node: Node): Node {
  const n = createNode(node.tag);
  n.id = node.id;
  n.classes = [...node.classes];
  n.atoms = [...node.atoms];
  n.macros = [...node.macros];
  n.attrs = new Map(node.attrs);
  n.rawStyle = node.rawStyle;
  n.pseudos = new Map([...node.pseudos].map(([k, v]) => [k, [...v]]));
  n.text = node.text;
  n.children = node.children.map(cloneNode);
  return n;
}

export function parse(tokens: Token[]): Node[] {
  let i = 0;

  function parseExpression(): Node[] {
    const nodes: Node[] = [];
    // Stack tracks nesting: each entry is the "current parent" array
    const stack: Node[][] = [nodes];

    function current(): Node[] {
      return stack[stack.length - 1];
    }

    while (i < tokens.length) {
      const tok = tokens[i];

      if (tok.type === TokenType.GROUP_CLOSE) {
        break; // Let the caller handle the closing paren
      }

      if (tok.type === TokenType.SIBLING) {
        // Pop back to parent level if we went into a child
        while (stack.length > 1) stack.pop();
        i++;
        continue;
      }

      if (tok.type === TokenType.CLIMB) {
        if (stack.length > 1) stack.pop();
        i++;
        continue;
      }

      if (tok.type === TokenType.CHILD) {
        // Next element becomes child of the last element in current list
        const parent = current();
        if (parent.length > 0) {
          const lastNode = parent[parent.length - 1];
          stack.push(lastNode.children);
        }
        i++;
        continue;
      }

      if (tok.type === TokenType.GROUP_OPEN) {
        i++; // skip (
        const groupNodes = parseExpression();
        i++; // skip )

        // Check for multiply
        if (i < tokens.length && tokens[i].type === TokenType.MULTIPLY) {
          const count = parseInt(tokens[i].value);
          i++;
          for (let r = 0; r < count; r++) {
            for (const gn of groupNodes) {
              current().push(cloneNode(gn));
            }
          }
        } else {
          for (const gn of groupNodes) {
            current().push(gn);
          }
        }
        continue;
      }

      // Bare text node (no tag)
      if (tok.type === TokenType.TEXT) {
        const textNode = createNode("");
        textNode.text = tok.value;
        current().push(textNode);
        i++;
        continue;
      }

      if (tok.type === TokenType.TAG) {
        const node = createNode(tok.value);
        i++;

        // Consume modifiers attached to this tag
        while (i < tokens.length) {
          const m = tokens[i];
          if (m.type === TokenType.CLASS) { node.classes.push(m.value); i++; }
          else if (m.type === TokenType.ID) { node.id = m.value; i++; }
          else if (m.type === TokenType.ATOM) { node.atoms.push(m.value); i++; }
          else if (m.type === TokenType.MACRO) { node.macros.push(m.value); i++; }
          else if (m.type === TokenType.TEXT) { node.text = m.value; i++; }
          else if (m.type === TokenType.RAW_STYLE) { node.rawStyle = m.value; i++; }
          else if (m.type === TokenType.PSEUDO) {
            const colonIdx = m.value.indexOf(":");
            const pseudoName = m.value.slice(0, colonIdx);
            const pseudoBody = m.value.slice(colonIdx + 1);
            const bodyAtoms = pseudoBody.split(".").filter(Boolean);
            node.pseudos.set(pseudoName, bodyAtoms);
            i++;
          }
          else if (m.type === TokenType.ATTR_OPEN) {
            i++; // skip [
            while (i < tokens.length && tokens[i].type !== TokenType.ATTR_CLOSE) {
              if (tokens[i].type === TokenType.ATTR_PAIR) {
                const eqIdx = tokens[i].value.indexOf("=");
                const key = tokens[i].value.slice(0, eqIdx);
                const val = tokens[i].value.slice(eqIdx + 1);
                node.attrs.set(key, val);
              } else if (tokens[i].type === TokenType.ATTR_BOOL) {
                node.attrs.set(tokens[i].value, "");
              }
              i++;
            }
            if (i < tokens.length) i++; // skip ]
          }
          else break;
        }

        // Check for multiply on single element
        if (i < tokens.length && tokens[i].type === TokenType.MULTIPLY) {
          const count = parseInt(tokens[i].value);
          i++;
          for (let r = 0; r < count; r++) {
            current().push(cloneNode(node));
          }
        } else {
          current().push(node);
        }
        continue;
      }

      // Skip unknown tokens
      i++;
    }

    return nodes;
  }

  return parseExpression();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/parser.ts tests/parser.test.ts
git commit -m "feat: add parser with tree building and all operators"
```

---

## Chunk 4: Code Generator

### Task 9: Code generator

**Files:**
- Create: `src/codegen.ts`
- Create: `tests/codegen.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/codegen.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/codegen.ts
import { Node } from "./types.js";
import { TAG_MAP, VOID_TAGS } from "./tables/tags.js";
import { ATTR_MAP, BOOL_ATTRS } from "./tables/attrs.js";
import { resolveAtom } from "./tables/atoms.js";
import { MACRO_MAP } from "./tables/macros.js";

function resolveTag(code: string): string {
  return TAG_MAP.get(code) ?? code;
}

function resolveAttrName(code: string): string {
  // data-* attributes
  if (code.startsWith("@")) return `data-${code.slice(1)}`;
  // aria-* attributes
  if (code.startsWith("!")) return `aria-${code.slice(1)}`;
  return ATTR_MAP.get(code) ?? code;
}

function buildStyle(node: Node): string {
  // Collect CSS declarations from macros first, then atoms override
  const declarations = new Map<string, string>(); // property → value

  function addDeclaration(css: string) {
    // css is like "display:flex" or "padding-left:1rem;padding-right:1rem"
    for (const decl of css.split(";")) {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) continue;
      const prop = decl.slice(0, colonIdx).trim();
      const val = decl.slice(colonIdx + 1).trim();
      declarations.set(prop, val);
    }
  }

  // Expand macros
  for (const macro of node.macros) {
    const expansion = MACRO_MAP.get(macro);
    if (expansion) {
      for (const atomCode of expansion) {
        const css = resolveAtom(atomCode);
        if (css) addDeclaration(css);
      }
    }
  }

  // Apply atoms (override macro values)
  for (const atom of node.atoms) {
    const css = resolveAtom(atom);
    if (css) addDeclaration(css);
  }

  // Raw style
  if (node.rawStyle) {
    addDeclaration(node.rawStyle);
  }

  if (declarations.size === 0) return "";
  return [...declarations.entries()].map(([p, v]) => `${p}:${v}`).join(";");
}

function generateNode(node: Node): string {
  // Bare text node (no tag)
  if (!node.tag) return node.text ?? "";

  const htmlTag = resolveTag(node.tag);
  const isVoid = VOID_TAGS.has(htmlTag);

  // Build attributes string
  const attrParts: string[] = [];

  if (node.id) {
    attrParts.push(`id="${node.id}"`);
  }

  if (node.classes.length > 0) {
    attrParts.push(`class="${node.classes.join(" ")}"`);
  }

  // Element attributes
  for (const [key, val] of node.attrs) {
    const attrName = resolveAttrName(key);
    if (BOOL_ATTRS.has(key) && val === "") {
      attrParts.push(attrName);
    } else {
      attrParts.push(`${attrName}="${val}"`);
    }
  }

  // Style
  const style = buildStyle(node);
  if (style) {
    attrParts.push(`style="${style}"`);
  }

  const attrStr = attrParts.length > 0 ? " " + attrParts.join(" ") : "";

  if (isVoid) {
    return `<${htmlTag}${attrStr}>`;
  }

  const childrenHtml = node.children.map(generateNode).join("");
  const textContent = node.text ?? "";

  return `<${htmlTag}${attrStr}>${textContent}${childrenHtml}</${htmlTag}>`;
}

export function generate(nodes: Node[]): string {
  return nodes.map(generateNode).join("");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/codegen.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/codegen.ts tests/codegen.test.ts
git commit -m "feat: add code generator with style expansion"
```

---

### Task 10: Pseudo-class scoped style generator

**Files:**
- Create: `src/scoper.ts`
- Create: `tests/scoper.test.ts`
- Modify: `src/codegen.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/scoper.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/scoper.ts
import { resolveAtom } from "./tables/atoms.js";

export const PSEUDO_MAP = new Map<string, string>([
  ["h", "hover"], ["f", "focus"], ["a", "active"],
  ["v", "visited"], ["fc", "first-child"], ["lc", "last-child"],
]);

export function generateScopedStyles(
  className: string,
  pseudos: Map<string, string[]>,
): string {
  const rules: string[] = [];
  for (const [shortcode, atoms] of pseudos) {
    const pseudoName = PSEUDO_MAP.get(shortcode) ?? shortcode;
    const declarations: string[] = [];
    for (const atom of atoms) {
      const css = resolveAtom(atom);
      if (css) declarations.push(css);
    }
    if (declarations.length > 0) {
      rules.push(`.${className}:${pseudoName}{${declarations.join(";")}}`);
    }
  }
  return rules.join("");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/scoper.test.ts`
Expected: PASS

- [ ] **Step 5: Update codegen to use scoper**

Update `src/codegen.ts` — add a counter and style accumulator:

Add to imports:
```ts
import { generateScopedStyles } from "./scoper.js";
```

Add module-level state in `generate()`:
```ts
export function generate(nodes: Node[]): string {
  let scopeCounter = 0;
  const styleBlocks: string[] = [];

  function generateNode(node: Node): string {
    // ... existing code ...

    // If node has pseudos, generate scoped class + style block
    if (node.pseudos.size > 0) {
      const scopedClass = `aim-${scopeCounter++}`;
      node.classes.push(scopedClass);
      styleBlocks.push(generateScopedStyles(scopedClass, node.pseudos));
    }

    // ... rest of existing code ...
  }

  const html = nodes.map(generateNode).join("");
  if (styleBlocks.length > 0) {
    return `<style>${styleBlocks.join("")}</style>${html}`;
  }
  return html;
}
```

- [ ] **Step 6: Add integration test for pseudo-classes**

Append to `tests/integration.test.ts` (after Task 11 creates it):

```ts
  it("compiles pseudo-class styles", () => {
    const aim = 'd.Bg#fff:h{Bg#eee}';
    const html = compile(aim);
    expect(html).toContain("<style>");
    expect(html).toContain(":hover");
    expect(html).toContain("background:#eee");
  });
```

- [ ] **Step 7: Run tests and commit**

```bash
npm test
git add src/scoper.ts tests/scoper.test.ts src/codegen.ts
git commit -m "feat: add pseudo-class scoped style generation"
```

---

## Chunk 5: Public API, CLI & Integration Tests

### Task 11: Public API

**Files:**
- Create: `src/index.ts`

- [ ] **Step 1: Write the failing test (in integration tests)**

```ts
// tests/integration.test.ts
import { describe, it, expect } from "vitest";
import { compile } from "../src/index.js";

describe("compile", () => {
  it("compiles a simple element", () => {
    expect(compile('p"Hello"')).toBe("<p>Hello</p>");
  });

  it("compiles nested structure", () => {
    expect(compile('d>p"Hi"')).toBe("<div><p>Hi</p></div>");
  });

  it("compiles siblings", () => {
    expect(compile('h1"A"+p"B"')).toBe("<h1>A</h1><p>B</p>");
  });

  it("compiles full card example", () => {
    const aim = 'd.%K>h3.Tb"Title"+p.Ts"Desc"';
    const html = compile(aim);
    expect(html).toContain("<div");
    expect(html).toContain("width:100%");
    expect(html).toContain("font-weight:bold");
    expect(html).toContain(">Title</h3>");
    expect(html).toContain("font-size:0.875rem");
    expect(html).toContain(">Desc</p>");
  });

  it("compiles attributes and text", () => {
    const aim = 'a[h=/page;tg=_blank]"Click"';
    const html = compile(aim);
    expect(html).toBe('<a href="/page" target="_blank">Click</a>');
  });

  it("compiles grouping with multiply", () => {
    const aim = '(l"item")*3';
    const html = compile(aim);
    expect(html).toBe("<li>item</li><li>item</li><li>item</li>");
  });

  it("compiles self-closing img", () => {
    const aim = 'm[s=/img.jpg;a=Photo]';
    const html = compile(aim);
    expect(html).toBe('<img src="/img.jpg" alt="Photo">');
  });

  it("compiles complex nested layout", () => {
    const aim = 'd.F.Ac.Jb.P4>(s.Tb"Logo"+n>u>(l>a[h=/a]"A"+l>a[h=/b]"B"))';
    const html = compile(aim);
    expect(html).toContain("display:flex");
    expect(html).toContain("align-items:center");
    expect(html).toContain("<nav><ul>");
    expect(html).toContain('href="/a"');
    expect(html).toContain('href="/b"');
  });

  it("compiles the full page example from the spec", () => {
    const aim =
      'd.%Col.Hs>(n.%R.P4.Bg#1a1a2e>(a[h=/]"Logo"+d.F.Gp4>(a[h=/about]"About"+a[h=/work]"Work"+a[h=/contact]"Contact"))+mn.F1.P8>(sc.%Col.Gp6.Xw800.Ma>(h1.T2x.Tb"Welcome"+p.Tl.C#666"Build faster with AIM"+d.F.Gp4>(a[h=#].%B"Get Started"+a[h=#].%B.Bg#fff.C#333.B1"Learn More"))+sc.Gc3.Gp6.My8>(d.%K>(h3.Tb"Fast"+p.Ts"80% fewer tokens")+d.%K>(h3.Tb"Simple"+p.Ts"Emmet-based syntax")+d.%K>(h3.Tb"Complete"+p.Ts"Full HTML coverage")))+ft.%R.P4.Bg#1a1a2e.C#fff>(p.Ts"© 2026 AIM"+d.F.Gp4>(a[h=#].%T.C#fff"Twitter"+a[h=#].%T.C#fff"GitHub")))';
    const html = compile(aim);
    // Verify structure
    expect(html).toContain("<nav");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
    expect(html).toContain(">Welcome</h1>");
    expect(html).toContain(">80% fewer tokens</p>");
    // Verify styles
    expect(html).toContain("height:100vh");
    expect(html).toContain("flex:1");
    expect(html).toContain("max-width:800px");
    // Verify it's valid-looking HTML (balanced tags at minimum)
    const openTags = (html.match(/<[a-z][^/]*>/g) ?? []).length;
    const closeTags = (html.match(/<\/[a-z]+>/g) ?? []).length;
    expect(openTags).toBeGreaterThan(10);
    expect(closeTags).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

```ts
// src/index.ts
import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { generate } from "./codegen.js";

export function compile(aim: string): string {
  const tokens = tokenize(aim);
  const ast = parse(tokens);
  return generate(ast);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.ts tests/integration.test.ts
git commit -m "feat: add compile() public API with integration tests"
```

---

### Task 12: CLI

**Files:**
- Create: `src/cli.ts`

- [ ] **Step 1: Write implementation**

```ts
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
```

- [ ] **Step 2: Manual test**

```bash
npm run aimc -- -e 'd.%C>h1.Tb"Hello AIM"'
```

Expected output: `<div style="display:flex;align-items:center;justify-content:center"><h1 style="font-weight:bold">Hello AIM</h1></div>`

- [ ] **Step 3: Test with --wrap flag**

```bash
npm run aimc -- -e 'd>p"Hi"' --wrap
```

Expected: Full HTML document with `<!DOCTYPE html>` wrapper.

- [ ] **Step 4: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add aimc CLI tool"
```

---

### Task 13: Run all tests, final verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: ALL PASS

- [ ] **Step 2: Test the full spec example end-to-end**

```bash
npm run aimc -- -e 'd.%Col.Hs>(n.%R.P4.Bg#1a1a2e>(a[h=/]"Logo"+d.F.Gp4>(a[h=/about]"About"+a[h=/work]"Work"+a[h=/contact]"Contact"))+mn.F1.P8>(sc.%Col.Gp6.Xw800.Ma>(h1.T2x.Tb"Welcome"+p.Tl.C#666"Build faster with AIM"+d.F.Gp4>(a[h=#].%B"Get Started"+a[h=#].%B.Bg#fff.C#333.B1"Learn More"))+sc.Gc3.Gp6.My8>(d.%K>(h3.Tb"Fast"+p.Ts"80% fewer tokens")+d.%K>(h3.Tb"Simple"+p.Ts"Emmet-based syntax")+d.%K>(h3.Tb"Complete"+p.Ts"Full HTML coverage")))+ft.%R.P4.Bg#1a1a2e.C#fff>(p.Ts"© 2026 AIM"+d.F.Gp4>(a[h=#].%T.C#fff"Twitter"+a[h=#].%T.C#fff"GitHub")))' --wrap -o /tmp/aim-test.html
```

- [ ] **Step 3: Verify output file exists and looks correct**

```bash
cat /tmp/aim-test.html
```

Expected: Complete HTML document with all the layout structure, styles, and text content.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final verification pass"
```
