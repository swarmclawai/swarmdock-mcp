import { describe, expect, it, vi } from "vitest";
import type { SwarmDockClient } from "@swarmdock/sdk";
import {
  Client as McpClient,
} from "@modelcontextprotocol/sdk/client/index.js";
import {
  InMemoryTransport,
} from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";

function makeStubClient(overrides: Record<string, unknown> = {}): SwarmDockClient {
  const listMock = vi.fn().mockResolvedValue({ tasks: [], limit: 20, offset: 0 });
  const getMock = vi.fn().mockResolvedValue({ id: "t_1", title: "Hello" });
  const balanceMock = vi.fn().mockResolvedValue({
    agentId: "a_1",
    earned: "0",
    spent: "0",
    currency: "USDC",
    network: "base",
  });

  const stub = {
    tasks: { list: listMock, get: getMock },
    payments: { balance: balanceMock },
    profile: {},
    social: {},
    mcpMarketplace: {},
    quality: {},
    analytics: {},
    rate: vi.fn(),
    register: vi.fn(),
    ...overrides,
  } as unknown as SwarmDockClient;
  return stub;
}

async function connectInMemory(client: SwarmDockClient) {
  const { server } = createServer({ client });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const mcp = new McpClient({ name: "test", version: "0.0.0" });
  await Promise.all([server.connect(serverTransport), mcp.connect(clientTransport)]);
  return { mcp, server };
}

describe("MCP tool surface", () => {
  it("lists all tool groups", async () => {
    const { mcp } = await connectInMemory(makeStubClient());
    const { tools } = await mcp.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("tasks_list");
    expect(names).toContain("tasks_get");
    expect(names).toContain("profile_get");
    expect(names).toContain("ratings_submit");
    expect(names).toContain("social_feed");
    expect(names).toContain("marketplace_list");
    expect(names).toContain("quality_get");
    expect(names).toContain("payments_balance");
    expect(names.length).toBeGreaterThanOrEqual(40);
  });

  it("routes tasks_list to the SDK", async () => {
    const client = makeStubClient();
    const { mcp } = await connectInMemory(client);

    const result = await mcp.callTool({
      name: "tasks_list",
      arguments: { status: "open", limit: 5 },
    });

    expect(result.isError).toBeFalsy();
    expect(client.tasks.list).toHaveBeenCalledOnce();
    const text = (result.content as Array<{ text: string }>)[0]?.text ?? "";
    expect(text).toContain("tasks");
  });

  it("returns a tool error when the SDK throws", async () => {
    const client = makeStubClient({
      tasks: {
        list: vi.fn().mockResolvedValue({ tasks: [] }),
        get: vi.fn().mockRejectedValue(new Error("boom")),
      },
    });
    const { mcp } = await connectInMemory(client);

    const result = await mcp.callTool({
      name: "tasks_get",
      arguments: { taskId: "abc" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ text: string }>)[0]?.text ?? "";
    expect(text).toContain("boom");
  });
});
