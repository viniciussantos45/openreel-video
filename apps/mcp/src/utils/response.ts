/**
 * Utility helpers shared by all tool modules.
 */

/** Wrap a value as an MCP text content response. */
export function ok(data: unknown): { content: [{ type: "text"; text: string }] } {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/** Wrap an error message as an MCP error response. */
export function err(message: string): { content: [{ type: "text"; text: string }]; isError: true } {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true as const };
}

/** Run a tool handler, catching synchronous and async errors. */
export async function run<T>(fn: () => T | Promise<T>): Promise<{ content: [{ type: "text"; text: string }]; isError?: true }> {
  try {
    const result = await fn();
    return ok(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return err(msg);
  }
}
