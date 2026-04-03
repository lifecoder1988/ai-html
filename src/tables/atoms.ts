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

  // Colors: C#hex, C#keyword (e.g. C#inherit), or C + css keyword (2+ chars)
  // Bg and Bc variants follow same pattern
  const colorMatch = code.match(/^(C|Bg|Bc)(#[0-9a-fA-F]{3,8}|#[a-z]+|[a-z]{2,})$/);
  if (colorMatch) {
    const propMap: Record<string, string> = { C: "color", Bg: "background", Bc: "border-color" };
    // Strip leading # from keyword values (e.g. #inherit → inherit)
    const val = colorMatch[2].startsWith("#") && !/^#[0-9a-fA-F]{3,8}$/.test(colorMatch[2])
      ? colorMatch[2].slice(1)
      : colorMatch[2];
    return `${propMap[colorMatch[1]]}:${val}`;
  }

  return null;
}
