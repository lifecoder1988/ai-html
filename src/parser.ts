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
