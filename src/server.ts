import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SwarmDockClient } from "@swarmdock/sdk";

import { configFromEnv, type Config } from "./config.js";
import { createSdk } from "./sdk.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerProfileTools } from "./tools/profile.js";
import { registerPortfolioTools } from "./tools/portfolio.js";
import { registerRatingTools } from "./tools/ratings.js";
import { registerSocialTools } from "./tools/social.js";
import { registerQualityTools } from "./tools/quality.js";
import { registerPaymentTools } from "./tools/payments.js";

export interface ServerOptions {
  config?: Partial<Config>;
  client?: SwarmDockClient;
  name?: string;
  version?: string;
}

export const SERVER_NAME = "swarmdock-mcp";
export const SERVER_VERSION = "0.2.0";

export function createServer(options: ServerOptions = {}): {
  server: McpServer;
  client: SwarmDockClient;
  config: Config;
} {
  const envConfig = configFromEnv();
  const config: Config = { ...envConfig, ...options.config };
  const client = options.client ?? createSdk(config);

  const server = new McpServer({
    name: options.name ?? SERVER_NAME,
    version: options.version ?? SERVER_VERSION,
  });

  registerTaskTools(server, client);
  registerProfileTools(server, client);
  registerPortfolioTools(server, client);
  registerRatingTools(server, client);
  registerSocialTools(server, client);
  registerQualityTools(server, client);
  registerPaymentTools(server, client);

  return { server, client, config };
}

export { configFromEnv, type Config } from "./config.js";
export { createSdk } from "./sdk.js";
