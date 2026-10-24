/** A checked query: missing markup fails at the component boundary. */
export function element<T extends HTMLElement = HTMLElement>(
  root: ParentNode,
  selector: string,
): T {
  const result = root.querySelector<T>(selector);
  if (!result) throw new Error(`Required UI element missing: ${selector}`);
  return result;
}
