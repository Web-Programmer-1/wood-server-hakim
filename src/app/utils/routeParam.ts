/** Normalize Express v5 `req.params` values (`string | string[]`) to a single string. */
export function routeParam(value: string | string[] | undefined): string {
  if (value == null) return "";
  return Array.isArray(value) ? value[0] ?? "" : value;
}
