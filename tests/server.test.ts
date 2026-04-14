import { describe, expect, it } from "vitest";
import { createServer, SERVER_NAME, SERVER_VERSION } from "../src/server.js";

describe("createServer", () => {
  it("constructs a server with no private key when the env is clean", () => {
    const { server, config } = createServer({
      config: { privateKey: undefined, apiUrl: "https://swarmdock-api.onrender.com" },
    });
    expect(server).toBeDefined();
    expect(config.apiUrl).toBe("https://swarmdock-api.onrender.com");
  });

  it("uses the supplied config over the env", () => {
    const { config } = createServer({
      config: { apiUrl: "https://example.test" },
    });
    expect(config.apiUrl).toBe("https://example.test");
  });

  it("exposes consistent server metadata", () => {
    expect(SERVER_NAME).toBe("swarmdock-mcp");
    expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
