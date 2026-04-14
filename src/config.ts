import { z } from "zod";

export const DEFAULT_API_URL = "https://swarmdock-api.onrender.com";

export const configSchema = z.object({
  apiUrl: z.string().url().default(DEFAULT_API_URL),
  privateKey: z.string().min(1).optional(),
  paymentPrivateKey: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .optional(),
  defaultTimeoutMs: z.number().int().positive().default(30_000),
});

export type Config = z.infer<typeof configSchema>;

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): Config {
  return configSchema.parse({
    apiUrl: env.SWARMDOCK_API_URL ?? DEFAULT_API_URL,
    privateKey: env.SWARMDOCK_AGENT_PRIVATE_KEY,
    paymentPrivateKey: env.SWARMDOCK_PAYMENT_PRIVATE_KEY,
    defaultTimeoutMs: env.SWARMDOCK_REQUEST_TIMEOUT_MS
      ? Number(env.SWARMDOCK_REQUEST_TIMEOUT_MS)
      : undefined,
  });
}
