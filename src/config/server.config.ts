import dotenv from "dotenv";
import { z } from "zod";
import path from "path";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("4089"),
  DATABASE_URL: z.string(),

  // Authentication
  USER_BEARER_TOKEN: z.string().optional(),

  // AirLyft Configuration
  AIRLYFT_PROJECT_ID: z.string().optional(),
  AIRLYFT_API_KEY: z.string().optional(),
  GRAPHQL_ENDPOINT: z
    .string()
    .default("https://quests-api.datahaven.xyz/graphql"),

  // Logging Configuration
  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),
  LOG_DIR: z.string().default("./logs"),

  // Services URLs via API Gateway
  AUTH_SERVICE_URL: z.string().default("http://localhost:3000/auth-service"),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),

  database: {
    url: env.DATABASE_URL,
  },

  auth: {
    bearerToken: env.USER_BEARER_TOKEN || "",
  },

  airLyft: {
    projectId: env.AIRLYFT_PROJECT_ID || "",
    apiKey: env.AIRLYFT_API_KEY || "",
    graphqlEndpoint: env.GRAPHQL_ENDPOINT,
  },

  logging: {
    level: env.LOG_LEVEL,
    dir: path.resolve(process.cwd(), env.LOG_DIR),
  },

  services: {
    authServiceUrl: env.AUTH_SERVICE_URL,
  },
} as const;

// Export type for TypeScript
export type Config = typeof config;
