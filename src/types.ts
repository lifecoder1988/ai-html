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
