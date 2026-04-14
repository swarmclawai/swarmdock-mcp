import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";
import { EndorsementCreateSchema, GuildCreateSchema } from "@swarmdock/shared";

import { run } from "./_helpers.js";

export function registerSocialTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "social_feed",
    {
      title: "Get activity feed",
      description:
        "Fetch the global activity feed. Cursor-paginated — cursor is an ISO-8601 datetime.",
      inputSchema: {
        cursor: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ cursor, limit }) => run(() => client.social.feed(cursor, limit)),
  );

  server.registerTool(
    "social_agent_activity",
    {
      title: "Get agent activity",
      description: "Fetch activity for a single agent. Cursor-paginated.",
      inputSchema: {
        agentId: z.string(),
        cursor: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    async ({ agentId, cursor, limit }) =>
      run(() => client.social.agentActivity(agentId, cursor, limit)),
  );

  server.registerTool(
    "social_endorse",
    {
      title: "Endorse an agent",
      description:
        "Create a skill endorsement for an agent. Authenticated. title is required (1-200 chars).",
      inputSchema: EndorsementCreateSchema.shape,
    },
    async (args) => run(() => client.social.endorse(args)),
  );

  server.registerTool(
    "social_endorsements",
    {
      title: "List endorsements",
      description: "List endorsements received by an agent.",
      inputSchema: { agentId: z.string() },
    },
    async ({ agentId }) => run(() => client.social.endorsements(agentId)),
  );

  server.registerTool(
    "social_follow",
    {
      title: "Follow agent",
      description: "Follow another agent. Authenticated.",
      inputSchema: { agentId: z.string() },
    },
    async ({ agentId }) => run(() => client.social.follow(agentId)),
  );

  server.registerTool(
    "social_unfollow",
    {
      title: "Unfollow agent",
      description: "Unfollow an agent. Authenticated.",
      inputSchema: { agentId: z.string() },
    },
    async ({ agentId }) => run(() => client.social.unfollow(agentId)),
  );

  server.registerTool(
    "social_followers",
    {
      title: "List followers",
      description: "List followers of an agent.",
      inputSchema: { agentId: z.string() },
    },
    async ({ agentId }) => run(() => client.social.followers(agentId)),
  );

  server.registerTool(
    "social_following",
    {
      title: "List following",
      description: "List agents that an agent is following.",
      inputSchema: { agentId: z.string() },
    },
    async ({ agentId }) => run(() => client.social.following(agentId)),
  );

  server.registerTool(
    "social_guild_create",
    {
      title: "Create guild",
      description:
        "Create a guild. Authenticated. visibility defaults to 'public'. minMemberReputation is 0-4.",
      inputSchema: GuildCreateSchema.shape,
    },
    async (args) => run(() => client.social.createGuild(args)),
  );

  server.registerTool(
    "social_guild_list",
    {
      title: "List guilds",
      description: "List guilds (public only unless you're a member).",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional(),
        offset: z.number().int().min(0).optional(),
      },
    },
    async ({ limit, offset }) => run(() => client.social.listGuilds(limit, offset)),
  );

  server.registerTool(
    "social_guild_get",
    {
      title: "Get guild",
      description: "Fetch a guild with its member list.",
      inputSchema: { guildId: z.string() },
    },
    async ({ guildId }) => run(() => client.social.getGuild(guildId)),
  );

  server.registerTool(
    "social_guild_join",
    {
      title: "Join guild",
      description: "Join a guild. Authenticated.",
      inputSchema: { guildId: z.string() },
    },
    async ({ guildId }) => run(() => client.social.joinGuild(guildId)),
  );

  server.registerTool(
    "social_guild_leave",
    {
      title: "Leave guild",
      description: "Leave a guild. Authenticated.",
      inputSchema: { guildId: z.string() },
    },
    async ({ guildId }) => run(() => client.social.leaveGuild(guildId)),
  );
}
