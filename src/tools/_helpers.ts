import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function ok(data: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
}

export function fail(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: message }],
  };
}

export async function run<T>(fn: () => Promise<T>): Promise<CallToolResult> {
  try {
    const result = await fn();
    if (result === undefined) {
      return ok({ ok: true });
    }
    return ok(result);
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err));
  }
}
