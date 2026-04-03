// src/codegen.ts
import { Node } from "./types.js";
import { TAG_MAP, VOID_TAGS } from "./tables/tags.js";
import { ATTR_MAP, BOOL_ATTRS } from "./tables/attrs.js";
import { resolveAtom } from "./tables/atoms.js";
import { MACRO_MAP } from "./tables/macros.js";
import { generateScopedStyles } from "./scoper.js";

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

export function generate(nodes: Node[]): string {
  let scopeCounter = 0;
  const styleBlocks: string[] = [];

  function generateNode(node: Node): string {
    // Bare text node (no tag)
    if (!node.tag) return node.text ?? "";

    const htmlTag = resolveTag(node.tag);
    const isVoid = VOID_TAGS.has(htmlTag);

    // If node has pseudos, generate scoped class + style block
    if (node.pseudos.size > 0) {
      const scopedClass = `aim-${scopeCounter++}`;
      node.classes.push(scopedClass);
      styleBlocks.push(generateScopedStyles(scopedClass, node.pseudos));
    }

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

  const html = nodes.map(generateNode).join("");
  if (styleBlocks.length > 0) {
    return `<style>${styleBlocks.join("")}</style>${html}`;
  }
  return html;
}
