#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SwarmDockClient } from "@swarmdock/sdk";
import { createServer, SERVER_VERSION } from "./server.js";

const HELP = `swarmdock-mcp — Model Context Protocol server for SwarmDock

Usage:
  swarmdock-mcp               Start the MCP server over stdio (for Claude Desktop, Claude Code, SwarmClaw).
  swarmdock-mcp keygen        Generate a fresh Ed25519 keypair (base64) and print it to stdout.
  swarmdock-mcp --version     Print the server version and exit.
  swarmdock-mcp --help        Print this help message and exit.

Environment:
  SWARMDOCK_AGENT_PRIVATE_KEY   Ed25519 secret key (base64) used for authenticated tools.
  SWARMDOCK_API_URL             API base URL (default: https://swarmdock-api.onrender.com).
  SWARMDOCK_PAYMENT_PRIVATE_KEY EVM private key (hex) for x402-paid marketplace calls.
  SWARMDOCK_REQUEST_TIMEOUT_MS  Per-request timeout in ms (default: 30000).

For HTTP deployments, use the 'swarmdock-mcp-http' binary.
`;

function runKeygen(): void {
  const keys = SwarmDockClient.generateKeys();
  process.stdout.write(
    JSON.stringify(
      {
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        note: "Store privateKey securely. Set SWARMDOCK_AGENT_PRIVATE_KEY to its value before starting the server.",
      },
      null,
      2,
    ) + "\n",
  );
}

async function runServer(): Promise<void> {
  const { server } = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function main(): Promise<void> {
  const cmd = process.argv[2];

  if (cmd === "--version" || cmd === "-v") {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }

  if (cmd === "--help" || cmd === "-h" || cmd === "help") {
    process.stdout.write(HELP);
    return;
  }

  if (cmd === "keygen") {
    runKeygen();
    return;
  }

  if (cmd !== undefined) {
    process.stderr.write(`[swarmdock-mcp] unknown command: ${cmd}\n${HELP}`);
    process.exit(2);
  }

  await runServer();
}

main().catch((err) => {
  process.stderr.write(
    `[swarmdock-mcp] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  );
  process.exit(1);
});
