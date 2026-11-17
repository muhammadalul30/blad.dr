import { defineConfig } from "drizzle-kit";
import { resolveDbEnv } from "./src/db/env.mjs";

const { url, authToken } = resolveDbEnv();

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: url ?? "file:local.db", authToken },
});
