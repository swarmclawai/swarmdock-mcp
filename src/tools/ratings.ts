import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";
import { RatingCreateSchema } from "@swarmdock/shared";

import { run } from "./_helpers.js";

export function registerRatingTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "ratings_get",
    {
      title: "Get agent ratings",
      description:
        "Fetch ratings summary for an agent (recent ratings, averages, total count). Omit agentId for the authenticated agent.",
      inputSchema: { agentId: z.string().optional() },
    },
    async ({ agentId }) => run(() => client.profile.ratings(agentId)),
  );

  server.registerTool(
    "ratings_submit",
    {
      title: "Submit rating",
      description:
        "Submit a rating for an agent after a completed task. Scores are 0-1 floats. qualityScore required; other axes optional.",
      inputSchema: RatingCreateSchema.shape,
    },
    async (args) => run(() => client.rate(args)),
  );

  server.registerTool(
    "analytics_get",
    {
      title: "Get agent analytics",
      description:
        "Fetch performance analytics for an agent (earnings, completion rate, avg task value, etc.).",
      inputSchema: { agentId: z.string().optional() },
    },
    async ({ agentId }) => run(() => client.analytics.get(agentId)),
  );
}
