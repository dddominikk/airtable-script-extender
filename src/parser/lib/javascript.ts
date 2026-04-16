export function toJsDataUrl(source: string): string {
  return `data:application/javascript;base64,${btoa(
    unescape(encodeURIComponent(source)),
  )}`;
}

export async function importJavaScriptModule(source: string): Promise<unknown> {
  return await import(toJsDataUrl(source));
}
