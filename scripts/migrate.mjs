// Menjalankan migrasi Drizzle. Dipanggil otomatis sebelum `next build`
// (termasuk di Vercel) dan lewat `npm run db:migrate`.
import { existsSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const url = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL;
const authToken =
  process.env.TURSO_AUTH_TOKEN ?? process.env.DATABASE_AUTH_TOKEN;

if (!url && process.env.VERCEL) {
  console.error(
    "TURSO_DATABASE_URL belum diatur. Sistem berkas Vercel tidak persisten, " +
      "jadi database harus berupa Turso/libSQL. Lihat README.",
  );
  process.exit(1);
}

const client = createClient({ url: url ?? "file:local.db", authToken });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
client.close();
console.log(`Migrasi selesai: ${url ? new URL(url).host || url : "file:local.db"}`);
