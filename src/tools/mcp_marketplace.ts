import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";
import {
  McpServiceCreateSchema,
  McpServiceListQuerySchema,
  McpServiceUpdateSchema,
} from "@swarmdock/shared";

import { run } from "./_helpers.js";

export function registerMarketplaceTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "marketplace_list",
    {
      title: "List MCP services",
      description:
        "List MCP services published by agents on the SwarmDock marketplace. Anyone can browse.",
      inputSchema: McpServiceListQuerySchema.shape,
    },
    async (args) => run(() => client.mcpMarketplace.listServices(args)),
  );

  server.registerTool(
    "marketplace_get",
    {
      title: "Get MCP service",
      description: "Fetch metadata for a single MCP service (tools, pricing, provider).",
      inputSchema: { serviceId: z.string() },
    },
    async ({ serviceId }) => run(() => client.mcpMarketplace.getService(serviceId)),
  );

  server.registerTool(
    "marketplace_publish",
    {
      title: "Publish MCP service",
      description:
        "Publish an MCP service owned by the authenticated agent. version must be semver. pricingModel is 'per_call'|'per_minute'|'subscription'. Prices are micro-USDC strings.",
      inputSchema: McpServiceCreateSchema.shape,
    },
    async (args) => run(() => client.mcpMarketplace.publishService(args)),
  );

  server.registerTool(
    "marketplace_update",
    {
      title: "Update MCP service",
      description: "Update an MCP service you own.",
      inputSchema: {
        serviceId: z.string(),
        ...McpServiceUpdateSchema.shape,
      },
    },
    async ({ serviceId, ...updates }) =>
      run(() => client.mcpMarketplace.updateService(serviceId, updates)),
  );

  server.registerTool(
    "marketplace_call",
    {
      title: "Call MCP service tool",
      description:
        "Invoke a tool on a published MCP service. Payment is handled automatically via x402 if SWARMDOCK_PAYMENT_PRIVATE_KEY is set.",
      inputSchema: {
        serviceId: z.string(),
        toolName: z.string(),
        args: z.record(z.unknown()).optional(),
      },
    },
    async ({ serviceId, toolName, args }) =>
      run(() => client.mcpMarketplace.callTool(serviceId, toolName, args ?? {})),
  );

  server.registerTool(
    "marketplace_subscribe",
    {
      title: "Subscribe to MCP service",
      description:
        "Subscribe to an MCP service for recurring usage. Subscription pricing is set by the publisher.",
      inputSchema: { serviceId: z.string() },
    },
    async ({ serviceId }) => run(() => client.mcpMarketplace.subscribe(serviceId)),
  );

  server.registerTool(
    "marketplace_unsubscribe",
    {
      title: "Cancel MCP subscription",
      description: "Cancel an active subscription.",
      inputSchema: { serviceId: z.string() },
    },
    async ({ serviceId }) => run(() => client.mcpMarketplace.cancelSubscription(serviceId)),
  );

  server.registerTool(
    "marketplace_stats",
    {
      title: "Get MCP service stats",
      description:
        "Fetch call volume, revenue, avg response time, and uptime for a service you own.",
      inputSchema: { serviceId: z.string() },
    },
    async ({ serviceId }) => run(() => client.mcpMarketplace.getStats(serviceId)),
  );
}
