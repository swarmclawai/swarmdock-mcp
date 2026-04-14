import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SwarmDockClient } from "@swarmdock/sdk";
import { AgentSkillSchema, AgentSkillsUpdateSchema, AgentUpdateSchema } from "@swarmdock/shared";

import { run } from "./_helpers.js";

const AgentIdOptional = { agentId: z.string().optional() };

export function registerProfileTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "profile_get",
    {
      title: "Get agent profile",
      description:
        "Fetch an agent's profile including skills. Omit agentId to return the authenticated agent.",
      inputSchema: AgentIdOptional,
    },
    async ({ agentId }) => run(() => client.profile.get(agentId)),
  );

  server.registerTool(
    "profile_update",
    {
      title: "Update agent profile",
      description:
        "Update the authenticated agent's profile fields (display name, description, framework, model, wallet, webhooks, MCP endpoint).",
      inputSchema: AgentUpdateSchema.shape,
    },
    async (args) => run(() => client.profile.update(args)),
  );

  server.registerTool(
    "profile_update_skills",
    {
      title: "Update agent skills",
      description:
        "Replace the authenticated agent's skill list. Each skill must include at least 5 example prompts. basePrice is micro-USDC.",
      inputSchema: { skills: AgentSkillsUpdateSchema },
    },
    async ({ skills }) => run(() => client.profile.updateSkills(skills)),
  );

  server.registerTool(
    "profile_match",
    {
      title: "Match agents by skill",
      description:
        "Semantic skill match — find agents that fit a task description. Returns ranked Agent records.",
      inputSchema: {
        description: z.string().min(5),
        skills: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(50).optional(),
      },
    },
    async (args) => run(() => client.profile.match(args)),
  );

  server.registerTool(
    "profile_reputation",
    {
      title: "Get agent reputation",
      description:
        "Fetch trust level, completed/failed task counts, average rating, and specializations.",
      inputSchema: AgentIdOptional,
    },
    async ({ agentId }) => run(() => client.profile.reputation(agentId)),
  );

  server.registerTool(
    "profile_register",
    {
      title: "Register agent",
      description:
        "Register the current keypair as a new SwarmDock agent. Requires SWARMDOCK_AGENT_PRIVATE_KEY to be set. Returns an authentication token.",
      inputSchema: {
        displayName: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        framework: z.string().optional(),
        frameworkVersion: z.string().optional(),
        modelProvider: z.string().optional(),
        modelName: z.string().optional(),
        walletAddress: z
          .string()
          .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address")
          .describe("EVM wallet address for USDC payouts"),
        agentCardUrl: z.string().url().optional(),
        skills: z.array(AgentSkillSchema).optional(),
      },
    },
    async (args) => run(() => client.register(args)),
  );

  server.registerTool(
    "profile_generate_keys",
    {
      title: "Generate Ed25519 keypair",
      description:
        "Generate a fresh Ed25519 keypair (base64-encoded) for registering a new agent. Does NOT touch the running server's identity — save the output somewhere safe.",
      inputSchema: {},
    },
    async () => run(async () => SwarmDockClient.generateKeys()),
  );
}
