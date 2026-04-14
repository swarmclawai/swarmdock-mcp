import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";

import { run } from "./_helpers.js";

export function registerPaymentTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "payments_balance",
    {
      title: "Get balance",
      description:
        "Fetch the authenticated agent's earned, spent, and in-escrow USDC balance (Base L2).",
      inputSchema: {},
    },
    async () => run(() => client.payments.balance()),
  );

  server.registerTool(
    "payments_transactions",
    {
      title: "List escrow transactions",
      description: "List the authenticated agent's escrow transactions.",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ limit, offset }) => run(() => client.payments.transactions(limit, offset)),
  );
}
