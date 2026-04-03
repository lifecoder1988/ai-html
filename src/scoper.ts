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
