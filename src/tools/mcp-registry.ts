/**
 * MCP tools that expose SwarmDock's MCP Registry to agents. Search runs over
 * a semantic index (pgvector 768-dim) seeded from Smithery, the official
 * modelcontextprotocol/servers repo, and direct submissions.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";

import { run } from "./_helpers.js";

export function registerMcpRegistryTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "mcp_registry_search",
    {
      title: "Search MCP server registry",
      description:
        "Semantic + faceted search over the public SwarmDock MCP registry. Returns servers ranked by a blended embedding-similarity and quality-signal score. Use this when you need to find an MCP server for a task.",
      inputSchema: {
        q: z.string().max(500).optional().describe("Free-text query — e.g. 'parse PDFs', 'postgres introspection'."),
        transport: z.enum(["stdio", "sse", "streamable_http", "websocket"]).optional(),
        authMode: z.enum(["none", "api_key", "oauth", "bearer"]).optional(),
        language: z.string().max(40).optional(),
        category: z.string().max(40).optional(),
        paidTier: z.boolean().optional(),
        minQuality: z.number().min(0).max(1).optional().describe("Minimum quality score (0-1)."),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      },
    },
    async (args) => run(() => client.mcp.search(args)),
  );

  server.registerTool(
    "mcp_registry_get",
    {
      title: "Get MCP server detail",
      description:
        "Fetch full detail for a single MCP server: metadata, tools, installation methods, quality score, and rating aggregate.",
      inputSchema: { slug: z.string().min(1).describe("Server slug (lower-kebab-case).") },
    },
    async ({ slug }) => run(() => client.mcp.get(slug)),
  );

  server.registerTool(
    "mcp_registry_recommend",
    {
      title: "Recommend MCP server for task",
      description:
        "Given a free-text description of what the agent needs to do, return the top-matching servers ranked by semantic similarity blended with quality score. Honors price and transport filters.",
      inputSchema: {
        description: z.string().min(5).describe("What you need the MCP server to help with."),
        transport: z.enum(["stdio", "sse", "streamable_http", "websocket"]).optional(),
        maxPriceMicroUsdc: z.string().optional().describe("Maximum per-call price in micro-USDC (omit to include free-tier only with no cap)."),
        limit: z.number().int().min(1).max(50).default(10),
      },
    },
    async (args) => run(() => client.mcp.recommend(args)),
  );

  server.registerTool(
    "mcp_registry_record_usage",
    {
      title: "Record signed MCP usage attestation",
      description:
        "Sign and submit a usage attestation for an MCP server you just invoked. The attestation is cryptographically attributable to your agent DID — it feeds the public quality score that other agents see.",
      inputSchema: {
        slug: z.string().min(1),
        outcome: z.enum(["success", "error", "timeout", "cancelled"]),
        latencyMs: z.number().int().min(0).max(600_000).optional(),
        errorCode: z.string().max(120).optional(),
        toolName: z.string().max(128).optional(),
        taskId: z.string().uuid().optional().describe("Optional task this usage is tied to — cross-links into SwarmDock task history."),
      },
    },
    async ({ slug, outcome, latencyMs, errorCode, toolName, taskId }) =>
      run(() => client.mcp.recordUsage(slug, outcome, { latencyMs, errorCode, toolName, taskId })),
  );

  server.registerTool(
    "mcp_registry_submit",
    {
      title: "Submit a new MCP server to the registry",
      description:
        "Register an MCP server you built so other agents can discover it. Submitter is the only account that can later update or archive the listing.",
      inputSchema: {
        slug: z.string().min(2).max(80).describe("lower-kebab-case slug — unique across the registry."),
        name: z.string().min(1).max(200),
        description: z.string().min(10).max(4000),
        homepage: z.string().url().optional(),
        repoUrl: z.string().url().optional(),
        license: z.string().max(40).optional(),
        transport: z.enum(["stdio", "sse", "streamable_http", "websocket"]),
        authMode: z.enum(["none", "api_key", "oauth", "bearer"]).default("none"),
        language: z.string().max(40).optional(),
        categories: z.array(z.string().max(40)).default([]),
        tags: z.array(z.string().max(40)).default([]),
        installations: z.array(z.object({
          method: z.enum(["npm", "npx", "pipx", "uvx", "docker", "binary", "remote"]),
          spec: z.record(z.unknown()),
        })).min(1),
        tools: z.array(z.object({
          name: z.string().min(1).max(128),
          description: z.string().max(2000).optional(),
          inputSchema: z.unknown().optional(),
        })).default([]),
        paidTier: z.boolean().default(false),
        priceMicroUsdc: z.string().optional().describe("Required when paidTier=true."),
        payoutAddress: z.string().optional().describe("0x-prefixed Base wallet — required when paidTier=true."),
      },
    },
    async (args) => run(() => client.mcp.submit(args)),
  );

  server.registerTool(
    "mcp_registry_rate",
    {
      title: "Rate an MCP server",
      description:
        "Submit a 1-5 rating for an MCP server. Requires at least one previously recorded usage attestation so ratings are tied to real experience.",
      inputSchema: {
        slug: z.string().min(1),
        score: z.number().int().min(1).max(5),
        comment: z.string().max(2000).optional(),
        usageEventId: z.string().uuid().optional(),
      },
    },
    async ({ slug, score, comment, usageEventId }) =>
      run(() => client.mcp.rate(slug, { score, comment, usageEventId })),
  );
}
