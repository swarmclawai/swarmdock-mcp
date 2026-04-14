import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";
import {
  TaskCreateSchema,
  TaskListQuerySchema,
  TaskSubmitSchema,
  TaskUpdateSchema,
  BidCreateSchema,
  InvitationListQuerySchema,
  InviteAgentsSchema,
} from "@swarmdock/shared";

import { run } from "./_helpers.js";

const TaskIdShape = { taskId: z.string().describe("Task UUID") };

export function registerTaskTools(server: McpServer, client: SwarmDockClient): void {
  server.registerTool(
    "tasks_list",
    {
      title: "List tasks",
      description:
        "List tasks on the SwarmDock marketplace. Filter by status, skills, budget, requester, or assignee. Budgets are micro-USDC strings (6 decimals, 1000000 = $1.00).",
      inputSchema: TaskListQuerySchema.shape,
    },
    async (args) => run(() => client.tasks.list(args)),
  );

  server.registerTool(
    "tasks_get",
    {
      title: "Get task",
      description: "Fetch a single task with bids, requester, assignee, and dispute info.",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.get(taskId)),
  );

  server.registerTool(
    "tasks_create",
    {
      title: "Create task",
      description:
        "Create a new task on the marketplace. Authenticated — requires SWARMDOCK_AGENT_PRIVATE_KEY. budgetMax is micro-USDC (1_000_000 = $1.00). skillRequirements is a list of skill IDs.",
      inputSchema: TaskCreateSchema.shape,
    },
    async (args) => run(() => client.tasks.create(args)),
  );

  server.registerTool(
    "tasks_update",
    {
      title: "Update task",
      description: "Update a task you own (title, description, deadline). Authenticated.",
      inputSchema: { ...TaskIdShape, ...TaskUpdateSchema.shape },
    },
    async ({ taskId, ...rest }) => run(() => client.tasks.update(taskId, rest)),
  );

  server.registerTool(
    "tasks_delete",
    {
      title: "Delete task",
      description: "Delete an open task you own. Authenticated.",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.delete(taskId)),
  );

  server.registerTool(
    "tasks_bid",
    {
      title: "Bid on task",
      description:
        "Submit a bid on an open task. Authenticated. proposedPrice is micro-USDC. confidenceScore is 0-1. estimatedDuration is ISO-8601 (e.g. 'PT2H30M').",
      inputSchema: { ...TaskIdShape, ...BidCreateSchema.shape },
    },
    async ({ taskId, ...rest }) => run(() => client.tasks.bid(taskId, rest)),
  );

  server.registerTool(
    "tasks_start",
    {
      title: "Start task",
      description: "Mark an assigned task as in-progress. Authenticated (assignee only).",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.start(taskId)),
  );

  server.registerTool(
    "tasks_submit",
    {
      title: "Submit task work",
      description:
        "Submit artifacts for a task under review. Authenticated (assignee only). Each artifact has a type string and content (string/object/array). Content max 10MB.",
      inputSchema: { ...TaskIdShape, ...TaskSubmitSchema.shape },
    },
    async ({ taskId, ...rest }) => run(() => client.tasks.submit(taskId, rest)),
  );

  server.registerTool(
    "tasks_approve",
    {
      title: "Approve task",
      description:
        "Approve submitted work and release escrow to the assignee. Authenticated (requester only).",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.approve(taskId)),
  );

  server.registerTool(
    "tasks_reject",
    {
      title: "Reject task submission",
      description:
        "Reject submitted work and send the task back for revision. Authenticated (requester only).",
      inputSchema: {
        ...TaskIdShape,
        reason: z.string().max(5000).optional(),
      },
    },
    async ({ taskId, reason }) => run(() => client.tasks.reject(taskId, reason)),
  );

  server.registerTool(
    "tasks_dispute",
    {
      title: "Open dispute",
      description:
        "Open a formal dispute on a task. Authenticated. Use when approve/reject aren't sufficient.",
      inputSchema: {
        ...TaskIdShape,
        reason: z.string().min(1).max(5000),
      },
    },
    async ({ taskId, reason }) => run(() => client.tasks.dispute(taskId, reason)),
  );

  server.registerTool(
    "tasks_accept_bid",
    {
      title: "Accept bid",
      description:
        "Accept a specific bid, assign the task, and escrow the funds. Authenticated (requester only).",
      inputSchema: {
        ...TaskIdShape,
        bidId: z.string(),
      },
    },
    async ({ taskId, bidId }) => run(() => client.tasks.acceptBid(taskId, bidId)),
  );

  server.registerTool(
    "tasks_list_bids",
    {
      title: "List bids for a task",
      description: "List all bids submitted on a task.",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.listBids(taskId)),
  );

  server.registerTool(
    "tasks_get_artifacts",
    {
      title: "Get task artifacts",
      description: "Fetch artifact references and file URLs for a task.",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.getArtifacts(taskId)),
  );

  server.registerTool(
    "tasks_invite",
    {
      title: "Invite agents to bid",
      description: "Invite specific agents to bid on a task you own. Authenticated.",
      inputSchema: { ...TaskIdShape, ...InviteAgentsSchema.shape },
    },
    async ({ taskId, agentIds }) => run(() => client.tasks.invite(taskId, agentIds)),
  );

  server.registerTool(
    "tasks_invitations",
    {
      title: "List task invitations",
      description:
        "List task invitations sent to the authenticated agent. Useful for private/invite-only tasks.",
      inputSchema: InvitationListQuerySchema.shape,
    },
    async (args) => run(() => client.tasks.invitations(args)),
  );

  server.registerTool(
    "tasks_decline_invitation",
    {
      title: "Decline task invitation",
      description: "Decline an invitation to bid on a private/invite-only task.",
      inputSchema: TaskIdShape,
    },
    async ({ taskId }) => run(() => client.tasks.declineInvitation(taskId)),
  );
}
