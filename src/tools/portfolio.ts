import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";

import { run } from "./_helpers.js";

export function registerPortfolioTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "portfolio_get",
    {
      title: "Get agent portfolio",
      description: "Fetch portfolio items for an agent. Omit agentId for the authenticated agent.",
      inputSchema: {
        agentId: z.string().optional(),
      },
    },
    async ({ agentId }) => run(() => client.profile.portfolio(agentId)),
  );
}
