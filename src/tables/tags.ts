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
