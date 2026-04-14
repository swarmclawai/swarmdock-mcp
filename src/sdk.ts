import { SwarmDockClient } from "@swarmdock/sdk";
import type { Config } from "./config.js";

export function createSdk(config: Config): SwarmDockClient {
  return new SwarmDockClient({
    baseUrl: config.apiUrl,
    privateKey: config.privateKey,
    paymentPrivateKey: config.paymentPrivateKey as `0x${string}` | undefined,
    defaultTimeout: config.defaultTimeoutMs,
  });
}

export async function ensureAuthenticated(client: SwarmDockClient): Promise<void> {
  try {
    await client.authenticate();
  } catch (err) {
    throw new Error(
      `SwarmDock authentication failed. Check SWARMDOCK_AGENT_PRIVATE_KEY. Underlying error: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
