# AIM (AI Markup) Language Design Spec

## Overview

AIM is a markup language designed for AI-to-AI communication, compiled to HTML+CSS. Its primary goal is **extreme token compression** — achieving ~76% fewer tokens than equivalent HTML while maintaining full HTML capability coverage.

**Key design decisions:**
- AI-to-AI intermediate format; human readability is not a priority
- Emmet-based syntax extended to a full language
- No closing tags, minimal delimiters
- Style system: atomic codes (short aliases) + composable macros
- Dedicated compiler (`aimc`) transpiles `.aim` files to HTML+CSS

---

## 1. Tag System

### Single-character tags (high frequency)

| Code | HTML    | Code | HTML     | Code | HTML     |
|------|---------|------|----------|------|----------|
| `d`  | div     | `s`  | span     | `p`  | p        |
| `a`  | a       | `b`  | button   | `i`  | input    |
| `f`  | form    | `n`  | nav      | `m`  | img      |
| `u`  | ul      | `o`  | ol       | `l`  | li       |
| `t`  | table   | `h`  | header   | `e`  | select   |
| `x`  | textarea|      |          |      |          |

### Two-character tags

| Code | HTML        | Code | HTML        | Code | HTML        |
|------|-------------|------|-------------|------|-------------|
| `h1`-`h6` | h1-h6 | `tr` | tr          | `td` | td          |
| `th` | th          | `sc` | section     | `ar` | article     |
| `mn` | main        | `ft` | footer      | `fg` | figure      |
| `dl` | details     | `sm` | summary     | `dg` | dialog      |
| `vd` | video       | `ad` | audio       | `sr` | source      |
| `em` | em          | `st` | strong      | `cd` | code        |
| `pr` | pre         | `bl` | blockquote  | `hr` | hr          |
| `br` | br          | `la` | label       | `op` | option      |
| `fs` | fieldset    | `if` | iframe      | `sv` | svg         |
| `cn` | canvas      | `pt` | path        | `og` | optgroup    |
| `fc` | figcaption  | `lg` | legend      |      |             |

---

## 2. Structure Syntax

Emmet-extended operators for expressing DOM tree relationships:

| Symbol | Meaning       | Example                |
|--------|---------------|------------------------|
| `>`    | Child         | `d>p"text"`            |
| `+`    | Sibling       | `h1"Hi"+p"Bye"`        |
| `^`    | Climb up      | `d>p"A"^d>p"B"`        |
| `()`   | Grouping      | `d>(h1"A"+p"B")`       |
| `*N`   | Repeat N times| `l"item"*3`            |

---

## 3. Attribute Syntax

CSS-selector style for id/class, bracket syntax for other attributes:

```
a#main.active[h=/page;tg=_blank]"Click"
```

Compiles to: `<a id="main" class="active" href="/page" target="_blank">Click</a>`

### Attribute abbreviation table

| Code | Attribute   | Code | Attribute   | Code | Attribute   |
|------|-------------|------|-------------|------|-------------|
| `h`  | href        | `s`  | src         | `t`  | type        |
| `n`  | name        | `v`  | value       | `p`  | placeholder |
| `a`  | alt         | `w`  | width       | `ht` | height      |
| `tg` | target      | `ac` | action      | `mt` | method      |
| `r`  | required    | `di` | disabled    | `ck` | checked     |
| `mn` | min         | `mx` | max         | `ro` | readonly    |
| `@X` | data-X      |      |             |      |             |

Boolean attributes are written without a value: `i[t=checkbox;ck;r]` → `<input type="checkbox" checked required>`

---

## 4. Text Content

- Short text: double quotes `"Hello World"`
- Escaped quotes: backslash `"He said \"hi\""`

---

## 5. Style System

### 5.1 Atomic Codes

Attached to elements with `.` prefix. Distinguished from CSS classes by **uppercase first letter**:

```
d.F.Ac.Jb.P4.myclass
```
- Uppercase start → atomic code (`F`, `Ac`, `Jb`, `P4`)
- Lowercase start → CSS class name (`myclass`)

#### Layout

| Code  | CSS                                    | Code  | CSS                          |
|-------|----------------------------------------|-------|------------------------------|
| `F`   | display:flex                           | `Fc`  | flex-direction:column        |
| `Fr`  | flex-direction:row                     | `Fw`  | flex-wrap:wrap               |
| `F1`  | flex:1                                 | `Fs0` | flex-shrink:0                |
| `G`   | display:grid                           | `Gc2` | grid-template-columns:repeat(2,1fr) |
| `Gc3` | grid-template-columns:repeat(3,1fr)   | `Gc4` | grid-template-columns:repeat(4,1fr) |
| `Db`  | display:block                          | `Di`  | display:inline               |
| `Dib` | display:inline-block                   | `Dn`  | display:none                 |

#### Alignment

| Code | CSS                              | Code | CSS                              |
|------|----------------------------------|------|----------------------------------|
| `Ac` | align-items:center               | `As` | align-items:flex-start           |
| `Ae` | align-items:flex-end             | `Ax` | align-items:stretch              |
| `Jc` | justify-content:center           | `Js` | justify-content:flex-start       |
| `Je` | justify-content:flex-end         | `Jb` | justify-content:space-between    |
| `Ja` | justify-content:space-around     |      |                                  |

#### Spacing (number = multiples of 0.25rem)

| Code       | CSS                        | Code       | CSS                        |
|------------|----------------------------|------------|----------------------------|
| `P0`-`P16` | padding: N×0.25rem         | `Px4`      | padding-left/right:1rem    |
| `Py2`      | padding-top/bottom:0.5rem  | `Pt4`      | padding-top:1rem           |
| `M0`-`M16` | margin: N×0.25rem          | `Mx4`      | margin-left/right:1rem     |
| `My2`      | margin-top/bottom:0.5rem   | `Ma`       | margin:auto                |

#### Sizing

| Code       | CSS               | Code       | CSS               |
|------------|-------------------|------------|--------------------|
| `W1`       | width:100%        | `W2`       | width:50%          |
| `Wf`       | width:fit-content | `Ws`       | width:100vw        |
| `H1`       | height:100%       | `Hs`       | height:100vh       |
| `Mw`+value | max-width         | `Mh`+value | max-height         |

#### Typography

| Code  | CSS                       | Code  | CSS                       |
|-------|---------------------------|-------|---------------------------|
| `Tc`  | text-align:center         | `Tr`  | text-align:right          |
| `Tb`  | font-weight:bold          | `Ti`  | font-style:italic         |
| `Tu`  | text-decoration:underline | `Tn`  | text-decoration:none      |
| `Ts`  | font-size:0.875rem        | `Tl`  | font-size:1.25rem         |
| `Tx`  | font-size:1.5rem          | `T2x` | font-size:2rem            |

#### Colors (followed by color value)

| Code      | CSS              |
|-----------|------------------|
| `C#fff`   | color:#fff       |
| `Bg#f00`  | background:#f00  |
| `Bc#ccc`  | border-color:#ccc|

#### Borders & Radius

| Code  | CSS                    | Code  | CSS                    |
|-------|------------------------|-------|------------------------|
| `B1`  | border:1px solid       | `B2`  | border:2px solid       |
| `Bn`  | border:none            | `Br4` | border-radius:1rem     |
| `Br2` | border-radius:0.5rem   | `Brf` | border-radius:9999px   |

#### Positioning

| Code     | CSS                | Code     | CSS                |
|----------|--------------------|----------|--------------------|
| `Pr`     | position:relative  | `Pa`     | position:absolute  |
| `Pf`     | position:fixed     | `Ps`     | position:sticky    |
| `Z1`-`Z50` | z-index         |          |                    |

#### Misc

| Code  | CSS                                      | Code  | CSS             |
|-------|------------------------------------------|-------|-----------------|
| `Oh`  | overflow:hidden                          | `Oa`  | overflow:auto   |
| `Os`  | overflow:scroll                          | `Cu`  | cursor:pointer  |
| `Op5` | opacity:0.5                              | `Sh`  | box-shadow (default shadow) |

#### Gap

| Code       | CSS               |
|------------|-------------------|
| `G2`-`G16` | gap: N×0.25rem    |

#### Raw CSS escape

For any CSS not covered by atomic codes:

```
d{transition:all .3s;backdrop-filter:blur(10px)}
```

### 5.2 Macros

`%` prefix. One code replaces a common combination of atomic codes:

| Macro  | Expands to                                       | Purpose              |
|--------|--------------------------------------------------|----------------------|
| `%C`   | F + Ac + Jc                                      | Centered flex        |
| `%R`   | F + Ac + Jb                                      | Row layout (spaced)  |
| `%Col` | F + Fc                                           | Column flex          |
| `%K`   | W1 + Br4 + Sh + P4                               | Card                 |
| `%B`   | Dib + P2 + Px4 + Bg#3b82f6 + C#fff + Br2 + Cu   | Button               |
| `%I`   | W1 + P2 + B1 + Bc#ccc + Br2                      | Input field          |
| `%O`   | Pa + W1 + H1                                     | Overlay              |
| `%T`   | Tn + C#inherit                                   | Unstyled link        |

Macros can be combined with atomic codes; atoms override macro defaults:
`d.%K.P8` — card with padding overridden to 2rem.

---

## 6. Compiler Design

### Pipeline

```
AIM source → Lexer → Parser → AST → CodeGen → HTML+CSS
```

### Lexer token types

| Token Type          | Example           |
|---------------------|-------------------|
| `TAG`               | `d`, `h1`, `sc`   |
| `CLASS`             | `.myclass`         |
| `ID`                | `#main`            |
| `ATOM`              | `.F`, `.Ac`, `.P4` |
| `MACRO`             | `.%C`, `.%K`       |
| `ATTR_OPEN/CLOSE`   | `[`, `]`           |
| `ATTR_PAIR`         | `h=/page`          |
| `TEXT`              | `"Hello"`          |
| `CHILD`             | `>`                |
| `SIBLING`           | `+`                |
| `CLIMB`             | `^`                |
| `GROUP_OPEN/CLOSE`  | `(`, `)`           |
| `MULTIPLY`          | `*3`               |
| `RAW_STYLE`         | `{transition:...}` |

### AST node structure

```
Node {
  tag: string
  id: string?
  classes: string[]
  atoms: string[]
  macros: string[]
  attrs: Map<string, string>
  rawStyle: string?
  text: string?
  children: Node[]
}
```

### Code generation

Traverse the AST, expand atomic codes and macros via lookup tables into inline `style` attributes, map tag codes to HTML tag names, and emit an HTML string.

---

## 7. File Format

- Extension: `.aim`
- Encoding: UTF-8
- Newlines are ignored (optional formatting only)
- Compile command: `aimc input.aim -o output.html`

---

## 8. Edge Cases

| Scenario                  | Syntax                        |
|---------------------------|-------------------------------|
| Empty element             | `d` or `d.F`                  |
| Bare text node            | `"just text"`                 |
| Multiple classes          | `d.foo.bar.baz`               |
| Atoms + classes mixed     | `d.F.Ac.myclass`              |
| Uncovered CSS             | `d{any-prop:any-value}`       |
| data attributes           | `d[@tooltip=hello]`           |
| Boolean attributes        | `i[t=checkbox;ck;r]`          |
| Repeat + grouping         | `(d.%K>h3"Card")*6`           |

---

## 9. Full Page Example

### AIM source (~520 chars, ~180 tokens)

```
d.%Col.Hs>(n.%R.P4.Bg#1a1a2e>(a[h=/]"Logo"+d.F.G4>(a[h=/about]"About"+a[h=/work]"Work"+a[h=/contact]"Contact"))+mn.F1.P8>(sc.%Col.G6.Mw800.Ma>(h1.T2x.Tb"Welcome"+p.Tl.C#666"Build faster with AIM"+d.F.G4>(a[h=#].%B"Get Started"+a[h=#].%B.Bg#fff.C#333.B1"Learn More"))+sc.Gc3.G6.My8>(d.%K>(h3.Tb"Fast"+p.Ts"80% fewer tokens")+d.%K>(h3.Tb"Simple"+p.Ts"Emmet-based syntax")+d.%K>(h3.Tb"Complete"+p.Ts"Full HTML coverage")))+ft.%R.P4.Bg#1a1a2e.C#fff>(p.Ts"© 2026 AIM"+d.F.G4>(a[h=#].%T.C#fff"Twitter"+a[h=#].%T.C#fff"GitHub")))
```

### Equivalent HTML output (~2400 chars, ~750 tokens)

Compression ratio: **~76%**

---

## 10. Implementation Language

The compiler (`aimc`) will be implemented as a CLI tool. Implementation language TBD in the planning phase.
