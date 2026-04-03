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
