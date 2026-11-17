// Menjalankan migrasi Drizzle. Dipanggil otomatis sebelum `next build`
// (termasuk di Vercel) dan lewat `npm run db:migrate`.
import { existsSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { relatedEnvNames, resolveDbEnv } from "../src/db/env.mjs";

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const { url, urlName, authToken, tokenName } = resolveDbEnv();

if (!url && process.env.VERCEL) {
  const related = relatedEnvNames();
  console.error(
    [
      "Database belum diatur: TURSO_DATABASE_URL tidak ditemukan di environment build ini.",
      `Environment Vercel: ${process.env.VERCEL_ENV ?? "?"} (branch ${process.env.VERCEL_GIT_COMMIT_REF ?? "?"}).`,
      related.length
        ? `Variabel terkait yang terlihat: ${related.join(", ")}.`
        : "Tidak ada variabel bernama TURSO/LIBSQL/DATABASE yang terlihat sama sekali.",
      "Pastikan variabel diisi untuk environment di atas (Production/Preview), lalu redeploy.",
      "Sistem berkas Vercel tidak persisten, jadi database harus berupa Turso/libSQL. Lihat README.",
    ].join("\n"),
  );
  process.exit(1);
}

if (url?.startsWith("libsql://") && !authToken) {
  console.error(`${urlName} diatur, tetapi TURSO_AUTH_TOKEN tidak ditemukan.`);
  process.exit(1);
}

const client = createClient({ url: url ?? "file:local.db", authToken });
await migrate(drizzle(client), { migrationsFolder: "./drizzle" });
client.close();

const target = url ? new URL(url).host || url : "file:local.db";
console.log(
  `Migrasi selesai: ${target}` +
    (urlName ? ` (dari ${urlName}${tokenName ? `, token dari ${tokenName}` : ""})` : ""),
);
