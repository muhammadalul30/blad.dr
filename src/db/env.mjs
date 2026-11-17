// Menentukan URL dan token database dari environment. Dipakai oleh aplikasi,
// scripts/migrate.mjs, dan drizzle.config.ts agar ketiganya selalu sepakat.
//
// Integrasi Turso di Vercel bisa memberi awalan pada nama variabel
// (mis. STORAGE_TURSO_DATABASE_URL), jadi selain nama baku dicari juga
// variabel apa pun yang berakhiran TURSO_DATABASE_URL / TURSO_AUTH_TOKEN.

const URL_NAMES = ["TURSO_DATABASE_URL", "DATABASE_URL", "LIBSQL_URL"];
const TOKEN_NAMES = ["TURSO_AUTH_TOKEN", "DATABASE_AUTH_TOKEN", "LIBSQL_AUTH_TOKEN"];

function pick(env, names, suffix) {
  for (const name of names) {
    if (env[name]) return { name, value: env[name] };
  }
  const prefixed = Object.keys(env)
    .filter((key) => key.endsWith(`_${suffix}`) && env[key])
    .sort();
  return prefixed.length ? { name: prefixed[0], value: env[prefixed[0]] } : null;
}

/** @returns {{ url: string | null, urlName: string | null, authToken: string | undefined, tokenName: string | null }} */
export function resolveDbEnv(env = process.env) {
  const url = pick(env, URL_NAMES, "TURSO_DATABASE_URL");
  const token = pick(env, TOKEN_NAMES, "TURSO_AUTH_TOKEN");
  return {
    url: url?.value ?? null,
    urlName: url?.name ?? null,
    authToken: token?.value,
    tokenName: token?.name ?? null,
  };
}

/** Nama (tanpa nilai) variabel yang tampaknya berkaitan dengan database, untuk diagnosis. */
export function relatedEnvNames(env = process.env) {
  return Object.keys(env)
    .filter((key) => /TURSO|LIBSQL|DATABASE|DB_URL/i.test(key))
    .sort();
}
