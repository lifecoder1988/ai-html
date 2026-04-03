# AIM (AI Markup)

A token-efficient markup language for AI-to-AI communication, compiled to HTML+CSS. Achieves ~76% fewer tokens than equivalent HTML.

## Quick Start

```bash
npm install
npx tsx src/cli.ts -e 'd.%C>h1.Tb"Hello AIM"'
# <div style="display:flex;align-items:center;justify-content:center"><h1 style="font-weight:bold">Hello AIM</h1></div>
```

## Syntax Overview

### Tags

Single/double character codes replace HTML tags:

```
d = div, s = span, p = p, a = a, b = button, i = input
m = img, n = nav, f = form, u = ul, o = ol, l = li
h1-h6, sc = section, ar = article, mn = main, ft = footer ...
```

### Structure (Emmet-style)

```
d>p"text"           child: <div><p>text</p></div>
h1"A"+p"B"          sibling: <h1>A</h1><p>B</p>
d>(h1"A"+p"B")      grouping
l"item"*3           multiply: 3x <li>item</li>
```

### Attributes

```
a[h=/page;tg=_blank]"Click"
  h=href, s=src, t=type, n=name, v=value, tg=target ...

i[t=checkbox;ck;r]       boolean attrs (checked, required)
d[@tooltip=hello]        data-* attributes
d[!label=Close;rl=btn]  aria-* attributes + role
```

### Styles

**Atomic codes** (uppercase = style, lowercase = CSS class):

```
d.F.Ac.Jb.P4.myclass
  F=flex, Ac=align-center, Jb=justify-between, P4=padding:1rem
```

| Category | Examples |
|----------|---------|
| Layout | `F` flex, `Fc` flex-col, `G` grid, `Gc3` grid 3-col |
| Align | `Ac` center, `Jb` between, `Jc` center |
| Spacing | `P4` padding:1rem, `Px4` pad-x, `M8` margin:2rem |
| Size | `W1` 100%, `Hs` 100vh, `Xw800` max-width:800px |
| Text | `Tb` bold, `Tc` center, `Ts` small, `T2x` 2rem |
| Color | `C#fff` color, `Bg#f00` background, `Bc#ccc` border-color |
| Border | `B1` 1px solid, `Br4` radius:1rem, `Brf` pill |
| Position | `Qr` relative, `Qa` absolute, `Z10` z-index:10 |
| Misc | `Oh` overflow:hidden, `Cu` pointer, `Sh` shadow |

**Macros** (common combinations):

```
%C   = centered flex (F + Ac + Jc)
%R   = row layout (F + Ac + Jb)
%Col = column flex (F + Fc)
%K   = card (W1 + Br4 + Sh + P4)
%B   = button (Dib + P2 + Px4 + Bg#3b82f6 + C#fff + Br2 + Cu)
%I   = input (W1 + P2 + B1 + Bc#ccc + Br2)
```

Atoms after macros override: `d.%K.P8` = card with padding overridden to 2rem.

**Pseudo-classes:**

```
d.Bg#fff:h{Bg#eee}     hover
i.B1:f{B2.Bc#00f}      focus
```

**Raw CSS escape:**

```
d{transition:all .3s;backdrop-filter:blur(10px)}
```

## Full Example

```
d.%Col.Hs>(n.%R.P4.Bg#1a1a2e>(a[h=/]"Logo"+d.F.Gp4>(a[h=/about]"About"+a[h=/work]"Work"))+mn.F1.P8>(h1.T2x.Tb"Welcome"+p.Tl.C#666"Build faster with AIM")+ft.%R.P4.Bg#1a1a2e.C#fff>p.Ts"© 2026 AIM")
```

Compiles to a full page with nav, main content, and footer — all with inline styles.

## CLI Usage

```bash
# Compile inline expression
npx tsx src/cli.ts -e '<aim expression>'

# Compile file
npx tsx src/cli.ts input.aim -o output.html

# Wrap in HTML document shell
npx tsx src/cli.ts -e 'd>p"Hi"' --wrap

# Help
npx tsx src/cli.ts --help
```

## API

```typescript
import { compile } from "./src/index.js";

const html = compile('d.%C>h1.Tb"Hello"');
// <div style="display:flex;align-items:center;justify-content:center"><h1 style="font-weight:bold">Hello</h1></div>
```

## Development

```bash
npm test          # run tests (80 tests)
npm run test:watch # watch mode
npm run build     # build CLI with tsup
```

## Spec

Full language specification: [docs/superpowers/specs/2026-04-03-aim-language-design.md](docs/superpowers/specs/2026-04-03-aim-language-design.md)
