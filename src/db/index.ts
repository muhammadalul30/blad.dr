import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { resolveDbEnv } from "./env.mjs";
import * as schema from "./schema";

// Satu klien per proses; di dev, hot reload tidak membuka koneksi baru.
const globalForDb = globalThis as unknown as { libsql?: Client };

function connect(): Client {
  const { url, authToken } = resolveDbEnv();
  return createClient({ url: url ?? "file:local.db", authToken });
}

const client = globalForDb.libsql ?? connect();

if (process.env.NODE_ENV !== "production") globalForDb.libsql = client;

export const db = drizzle(client, { schema });
