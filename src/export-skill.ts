#!/usr/bin/env npx tsx
// src/export-skill.ts — Build and export AIM as a Claude Code skill
// Usage: npx tsx src/export-skill.ts [output-dir]
//   default output: ~/.claude/skills/aim/

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, copyFileSync, chmodSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { TAG_MAP, VOID_TAGS } from "./tables/tags.js";
import { ATTR_MAP, BOOL_ATTRS } from "./tables/attrs.js";
import { MACRO_MAP } from "./tables/macros.js";

const PROJECT_ROOT = resolve(dirname(import.meta.url.replace("file://", "")), "..");
const args = process.argv.slice(2);
const skillDir = resolve(args[0] ?? `${process.env.HOME}/.claude/skills/aim`);

// ── 1. Build CLI bundle ──

console.log("Building CLI...");
execSync("npx tsup src/cli.ts --format esm --no-dts", {
  cwd: PROJECT_ROOT,
  stdio: "inherit",
});

// ── 2. Create skill directory structure ──

const binDir = resolve(skillDir, "bin");
mkdirSync(binDir, { recursive: true });

// Copy bundled CLI as .mjs so node treats it as ESM without package.json
copyFileSync(resolve(PROJECT_ROOT, "dist/cli.js"), resolve(binDir, "cli.mjs"));

// Shell wrapper — the primary entry point
const shWrapper = `#!/bin/sh
exec node "$(dirname "$0")/cli.mjs" "$@"
`;
writeFileSync(resolve(binDir, "aimc"), shWrapper, { mode: 0o755 });

// ── 3. Helpers for generating reference tables ──

function tagTable(map: Map<string, string>, cols = 3): string {
  const entries = [...map.entries()];
  const rows: string[] = [];
  for (let i = 0; i < entries.length; i += cols) {
    const cells = entries.slice(i, i + cols).map(([k, v]) => `| \`${k}\` | ${v} `);
    while (cells.length < cols) cells.push("| | ");
    rows.push(cells.join("") + "|");
  }
  const header = Array.from({ length: cols }, () => "| Code | HTML ").join("") + "|";
  const sep = Array.from({ length: cols }, () => "|------|------").join("") + "|";
  return [header, sep, ...rows].join("\n");
}

function attrTable(map: Map<string, string>): string {
  const entries = [...map.entries()];
  const rows: string[] = [];
  for (let i = 0; i < entries.length; i += 3) {
    const cells = entries.slice(i, i + 3).map(([k, v]) => `| \`${k}\` | ${v} `);
    while (cells.length < 3) cells.push("| | ");
    rows.push(cells.join("") + "|");
  }
  return ["| Code | Attr | Code | Attr | Code | Attr |", "|------|------|------|------|------|------|", ...rows].join("\n");
}

function macroTable(map: Map<string, string[]>): string {
  const purposeMap: Record<string, string> = {
    "%C": "Centered flex", "%R": "Row (space-between)", "%Col": "Column flex",
    "%K": "Card", "%B": "Button", "%I": "Input field", "%O": "Overlay", "%T": "Text link",
  };
  const rows = [...map.entries()].map(
    ([k, v]) => `| \`${k}\` | ${v.join(" + ")} | ${purposeMap[k] ?? ""} |`
  );
  return ["| Macro | Expands to | Purpose |", "|-------|-----------|---------|", ...rows].join("\n");
}

// ── 4. Generate SKILL.md ──

const skillMd = `---
name: aim
version: 1.0.0
description: |
  AIM (AI Markup) — a token-efficient markup language that compiles to HTML+CSS.
  ~76% fewer tokens than equivalent HTML. Use when generating HTML output, building
  UI components, creating web pages, or when the user asks to "write AIM", "use AIM",
  "generate HTML", "build a page", or references AIM syntax.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# AIM (AI Markup) Skill

AIM is a token-efficient markup language that compiles to inline-styled HTML.

## Setup (run first)

\`\`\`bash
_SKILL_DIR=~/.claude/skills/aim
_AIMC="$_SKILL_DIR/bin/aimc"
if [ -x "$_AIMC" ]; then
  echo "READY: $_AIMC"
  $_AIMC -e 'd"ok"' >/dev/null 2>&1 && echo "VERIFIED" || echo "VERIFY_FAILED"
else
  echo "NEEDS_INSTALL"
fi
\`\`\`

If \`NEEDS_INSTALL\`: tell the user "AIM skill needs setup. Run: \`cd ${PROJECT_ROOT} && npm run export-skill\`"

## CLI Usage

Use \`$_AIMC\` (set by the preamble) to compile AIM expressions:

\`\`\`bash
# Compile inline expression → stdout
$_AIMC -e 'd.%C>h1.Tb"Hello AIM"'

# Compile file → stdout
$_AIMC input.aim

# Compile file → output file
$_AIMC input.aim -o output.html

# Wrap in full HTML document shell
$_AIMC -e 'd>p"Hi"' --wrap
\`\`\`

### Typical workflow

\`\`\`bash
# 1. Write AIM to a file
cat > /tmp/page.aim << 'EOF'
d.%Col.Hs>(n.%R.P4.Bg#1a1a2e.C#fff>(a[h=/]"Logo"+d.F.Gp4>(a[h=/about]"About"+a[h=/work]"Work"))+mn.F1.%C>h1.T2x.Tb"Hello"+ft.%C.P4.Bg#1a1a2e.C#fff>p.Ts"© 2026")
EOF

# 2. Compile to HTML
$_AIMC /tmp/page.aim --wrap -o /tmp/page.html

# 3. Preview (open in browser)
open /tmp/page.html
\`\`\`

## Syntax Reference

### Tags

${tagTable(TAG_MAP)}

Void (self-closing): ${[...VOID_TAGS].map((t) => `\`${t}\``).join(", ")}.

### Structure

\`\`\`
d>p"text"           child
h1"A"+p"B"          sibling
d>(h1"A"+p"B")      grouping
l"item"*3           multiply (3x)
\`\`\`

### Text

Double quotes after tag: \`p"Hello"\`, \`h1"Title"\`

### Attributes \`[key=val;key2=val2]\`

\`\`\`
a[h=/page;tg=_blank]"Click"     href, target
i[t=checkbox;ck;r]               type, checked, required
d[@tooltip=hello]                data-* (@ prefix)
d[!label=Close;rl=btn]          aria-* (! prefix) + role
\`\`\`

Shortcodes:

${attrTable(ATTR_MAP)}

Boolean (no value): ${[...BOOL_ATTRS].map((b) => `\`${b}\``).join(", ")}.

### Styles \`.CODE\`

Uppercase = inline style, lowercase = CSS class: \`d.F.Ac.Jb.P4.myclass\`

**Static atoms:**

| Code | CSS | Code | CSS |
|------|-----|------|-----|
| \`F\` | display:flex | \`Fc\` | flex-direction:column |
| \`Fr\` | flex-direction:row | \`Fw\` | flex-wrap:wrap |
| \`F1\` | flex:1 | \`Fs0\` | flex-shrink:0 |
| \`G\` | display:grid | \`Gc2/3/4\` | grid N-col |
| \`Db\` | display:block | \`Dib\` | display:inline-block |
| \`Di\` | display:inline | \`Dn\` | display:none |
| \`Ac\` | align-items:center | \`As/Ae/Ax\` | start/end/stretch |
| \`Jc\` | justify-content:center | \`Jb/Ja/Js/Je\` | between/around/start/end |
| \`W1\` | width:100% | \`W2\` | width:50% |
| \`Wf\` | width:fit-content | \`Ws\` | width:100vw |
| \`H1\` | height:100% | \`Hs\` | height:100vh |
| \`Tb\` | font-weight:bold | \`Ti\` | font-style:italic |
| \`Tc\` | text-align:center | \`Tr\` | text-align:right |
| \`Tu\` | text-decoration:underline | \`Tn\` | text-decoration:none |
| \`Ts\` | font-size:0.875rem | \`Tl\` | font-size:1.25rem |
| \`Tx\` | font-size:1.5rem | \`T2x\` | font-size:2rem |
| \`B1\` | border:1px solid | \`B2\` | border:2px solid |
| \`Bn\` | border:none | \`Br2/Br4/Brf\` | radius 0.5/1/pill |
| \`Qr\` | position:relative | \`Qa/Qf/Qs\` | absolute/fixed/sticky |
| \`Oh\` | overflow:hidden | \`Oa/Os\` | auto/scroll |
| \`Cu\` | cursor:pointer | \`Sh\` | box-shadow |
| \`Ma\` | margin:auto | | |

**Dynamic atoms** (N * 0.25rem):

| Pattern | Example | CSS |
|---------|---------|-----|
| \`P{N}\` / \`Px/Py/Pt/Pb/Pl/Pr{N}\` | \`P4\` | padding:1rem |
| \`M{N}\` / \`Mx/My/Mt/Mb/Ml/Mr{N}\` | \`M8\` | margin:2rem |
| \`Gp{N}\` | \`Gp4\` | gap:1rem |
| \`Z{N}\` | \`Z10\` | z-index:10 |
| \`Op{N}\` | \`Op5\` | opacity:0.5 |
| \`Xw/Xh{V}\` | \`Xw800\` | max-width:800px |
| \`T/R/B/L{V}\` | \`T0\` | top:0 |

Value suffixes: bare = px, \`p\` = %, \`r\` = rem.

**Colors:** \`C#fff\` color, \`Bg#f00\` background, \`Bc#ccc\` border-color. \`#keyword\` → CSS keyword.

### Macros \`%NAME\`

${macroTable(MACRO_MAP)}

Atoms after macros override: \`d.%K.P8\` = card with padding:2rem.

### Pseudo-classes \`:state{atoms}\`

\`\`\`
d.Bg#fff:h{Bg#eee}       hover
i.B1:f{B2.Bc#00f}        focus
\`\`\`

### Raw CSS \`{...}\`

\`\`\`
d{transition:all .3s;backdrop-filter:blur(10px)}
\`\`\`

## Examples

\`\`\`bash
# Centered heading
$_AIMC -e 'd.%C>h1.Tb"Hello AIM"'

# Card grid
$_AIMC -e 'd.Gc3.Gp4.P4>(d.%K>(h2.Tb"Card 1"+p"Desc")+d.%K>(h2.Tb"Card 2"+p"Desc")+d.%K>(h2.Tb"Card 3"+p"Desc"))'

# Form
$_AIMC -e 'f.%Col.Gp4.Xw400.Ma[ac=/submit;mt=post]>(la"Name"+i.%I[t=text;n=name;r]+la"Email"+i.%I[t=email;n=email;r]+b.%B[t=submit]"Submit")'

# Full page with nav, main, footer
$_AIMC -e 'd.%Col.Hs>(n.%R.P4.Bg#1a1a2e.C#fff>(a[h=/]"Logo"+d.F.Gp4>(a[h=/about]"About"+a[h=/work]"Work"))+mn.F1.P8>(h1.T2x.Tb"Welcome"+p.Tl.C#666"Build faster")+ft.%R.P4.Bg#1a1a2e.C#fff>p.Ts"© 2026")' --wrap -o /tmp/page.html

# Button with hover
$_AIMC -e 'b.%B:h{Bg#2563eb}"Click me"'
\`\`\`

## Tips

1. **Structure first** — \`>\` child, \`+\` sibling, \`()\` grouping
2. **Macros first** — \`%C\`, \`%R\`, \`%K\` cover most layouts
3. **Override with atoms** — atoms after macros win
4. **Raw CSS for one-offs** — \`{transition:all .3s}\`
5. **Keep flat** — avoid deep nesting, break into parts
`;

writeFileSync(resolve(skillDir, "SKILL.md"), skillMd);

console.log(`\nSkill exported to ${skillDir}/`);
console.log(`  SKILL.md     — skill definition with syntax reference`);
console.log(`  bin/cli.mjs  — bundled AIM compiler (ESM)`);
console.log(`  bin/aimc     — shell wrapper entry point`);
