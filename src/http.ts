#!/usr/bin/env node
import { createServer as createHttpServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, type ServerOptions } from "./server.js";
import { configFromEnv, DEFAULT_API_URL, type Config } from "./config.js";

interface HttpServerOptions {
  port: number;
  host: string;
  allowAnonymous: boolean;
  apiUrl: string;
}

function parseOptions(): HttpServerOptions {
  const argv = process.argv.slice(2);
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) continue;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args.set(key, next);
        i += 1;
      } else {
        args.set(key, "true");
      }
    }
  }

  const port = Number(args.get("port") ?? process.env.PORT ?? 4000);
  const host = args.get("host") ?? process.env.HOST ?? "0.0.0.0";
  const allowAnonymous = (args.get("allow-anonymous") ?? process.env.SWARMDOCK_MCP_ALLOW_ANONYMOUS ?? "false") === "true";
  const apiUrl = args.get("api-url") ?? process.env.SWARMDOCK_API_URL ?? DEFAULT_API_URL;

  return { port, host, allowAnonymous, apiUrl };
}

function extractBearer(req: IncomingMessage): string | undefined {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return undefined;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function reply(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function main(): Promise<void> {
  const opts = parseOptions();
  const envConfig = configFromEnv();

  const httpServer = createHttpServer(async (req, res) => {
    try {
      if (req.method === "GET" && req.url === "/healthz") {
        reply(res, 200, { ok: true, name: "swarmdock-mcp", apiUrl: opts.apiUrl });
        return;
      }

      if (!req.url?.startsWith("/mcp")) {
        reply(res, 404, { error: "not_found", hint: "POST /mcp" });
        return;
      }

      const bearer = extractBearer(req);
      const config: Partial<Config> = { apiUrl: opts.apiUrl };

      if (bearer) {
        config.privateKey = bearer;
      } else if (envConfig.privateKey) {
        config.privateKey = envConfig.privateKey;
      } else if (!opts.allowAnonymous) {
        reply(res, 401, {
          error: "unauthorized",
          hint: "Pass an Ed25519 secret key (base64) as 'Authorization: Bearer <key>' or set SWARMDOCK_AGENT_PRIVATE_KEY on the server.",
        });
        return;
      }

      const serverOptions: ServerOptions = { config };
      const { server } = createServer(serverOptions);

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableJsonResponse: true,
      });

      res.on("close", () => {
        void transport.close().catch(() => undefined);
        void server.close().catch(() => undefined);
      });

      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[swarmdock-mcp-http] request error: ${message}\n`);
      if (!res.headersSent) {
        reply(res, 500, { error: "internal_error", message });
      } else {
        res.end();
      }
    }
  });

  httpServer.listen(opts.port, opts.host, () => {
    process.stdout.write(
      `[swarmdock-mcp-http] listening on http://${opts.host}:${opts.port}/mcp (api=${opts.apiUrl}, anon=${opts.allowAnonymous})\n`,
    );
  });
}

main().catch((err) => {
  process.stderr.write(
    `[swarmdock-mcp-http] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  );
  process.exit(1);
});
