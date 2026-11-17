import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, gte, lt, lte } from "drizzle-orm";
import { db } from "@/db";
import { intakes, ipssEntries, users, voids, type User } from "@/db/schema";
import { readSession } from "./session";
import { addDays } from "./time";

// Data Access Layer. Setiap fungsi baca memverifikasi sesi sendiri dan selalu
// menyaring dengan id pengguna dari sesi, tidak pernah dari input klien.
// Tidak ada peran: seorang pengguna hanya bisa menjangkau datanya sendiri.

export type Profile = Omit<User, "passwordHash" | "sessionKey" | "failedLogins" | "lockedUntil">;

export const getUser = cache(async (): Promise<Profile | null> => {
  const session = await readSession();
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  if (!user || user.sessionKey !== session.sessionKey) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, sessionKey, failedLogins, lockedUntil, ...profile } = user;
  return profile;
});

export async function requireUser(): Promise<Profile> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Catatan BAK milik pengguna dari tanggal `from` sampai `to`, inklusif. */
export async function getVoids(from: string, to: string) {
  const user = await requireUser();
  return db
    .select()
    .from(voids)
    .where(
      and(eq(voids.userId, user.id), gte(voids.occurredAt, from), lt(voids.occurredAt, addDays(to, 1))),
    )
    .orderBy(asc(voids.occurredAt));
}

export async function getVoid(id: number) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(voids)
    .where(and(eq(voids.id, id), eq(voids.userId, user.id)));
  return row ?? null;
}

export async function getIntakes(from: string, to: string) {
  const user = await requireUser();
  return db
    .select()
    .from(intakes)
    .where(
      and(
        eq(intakes.userId, user.id),
        gte(intakes.occurredAt, from),
        lt(intakes.occurredAt, addDays(to, 1)),
      ),
    )
    .orderBy(asc(intakes.occurredAt));
}

export async function getIntake(id: number) {
  const user = await requireUser();
  const [row] = await db
    .select()
    .from(intakes)
    .where(and(eq(intakes.id, id), eq(intakes.userId, user.id)));
  return row ?? null;
}

/** Riwayat IPSS, terbaru lebih dulu. */
export async function getIpssHistory(limit = 100) {
  const user = await requireUser();
  return db
    .select()
    .from(ipssEntries)
    .where(eq(ipssEntries.userId, user.id))
    .orderBy(desc(ipssEntries.takenOn), desc(ipssEntries.id))
    .limit(limit);
}

export async function getIpssInRange(from: string, to: string) {
  const user = await requireUser();
  return db
    .select()
    .from(ipssEntries)
    .where(
      and(eq(ipssEntries.userId, user.id), gte(ipssEntries.takenOn, from), lte(ipssEntries.takenOn, to)),
    )
    .orderBy(asc(ipssEntries.takenOn), asc(ipssEntries.id));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const withoutOwner = <T extends { userId: number }>({ userId, ...row }: T) => row;

/** Seluruh data milik pengguna, untuk ekspor. */
export async function getAllData() {
  const { id, ...profile } = await requireUser();
  const [voidRows, intakeRows, ipssRows] = await Promise.all([
    db.select().from(voids).where(eq(voids.userId, id)).orderBy(asc(voids.occurredAt)),
    db.select().from(intakes).where(eq(intakes.userId, id)).orderBy(asc(intakes.occurredAt)),
    db.select().from(ipssEntries).where(eq(ipssEntries.userId, id)).orderBy(asc(ipssEntries.takenOn)),
  ]);
  return {
    profile,
    voids: voidRows.map(withoutOwner),
    intakes: intakeRows.map(withoutOwner),
    ipss: ipssRows.map(withoutOwner),
  };
}
