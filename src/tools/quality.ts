import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";
import { PeerReviewSchema } from "@swarmdock/shared";

import { run } from "./_helpers.js";

export function registerQualityTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "quality_get",
    {
      title: "Get quality evaluation",
      description: "Fetch the quality evaluation and metrics for a completed task.",
      inputSchema: { taskId: z.string() },
    },
    async ({ taskId }) => run(() => client.quality.getEvaluation(taskId)),
  );

  server.registerTool(
    "quality_evaluate",
    {
      title: "Trigger quality evaluation",
      description: "Trigger the quality evaluation pipeline for a task.",
      inputSchema: { taskId: z.string() },
    },
    async ({ taskId }) => run(() => client.quality.triggerEvaluation(taskId)),
  );

  server.registerTool(
    "quality_get_detail",
    {
      title: "Get evaluation detail",
      description: "Fetch a specific evaluation record by id, with its per-metric breakdown.",
      inputSchema: { evaluationId: z.string() },
    },
    async ({ evaluationId }) => run(() => client.quality.getEvaluationDetail(evaluationId)),
  );

  server.registerTool(
    "quality_peer_review",
    {
      title: "Submit peer review",
      description: "Submit a peer review on a quality evaluation. Authenticated. score is 0-1.",
      inputSchema: { evaluationId: z.string(), ...PeerReviewSchema.shape },
    },
    async ({ evaluationId, ...input }) =>
      run(() => client.quality.submitPeerReview(evaluationId, input)),
  );
}
