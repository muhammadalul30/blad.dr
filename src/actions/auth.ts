"use server";

import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { invalid, type FormState } from "@/lib/form";
import { createSession, deleteSession } from "@/lib/session";
import { isValidTimezone } from "@/lib/time";

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const LOGIN_FAILED = "Email atau password salah.";

const password = z
  .string()
  .min(10, "Minimal 10 karakter.")
  .max(72, "Maksimal 72 karakter.");

const email = z.string().trim().toLowerCase().pipe(z.email("Email tidak valid."));

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
    email,
    password,
    confirm: z.string(),
    timezone: z.string().refine(isValidTimezone).catch("Asia/Jakarta"),
    code: z.string().default(""),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Konfirmasi tidak sama dengan password.",
  });

function sameString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  const requiredCode = process.env.REGISTRATION_CODE;
  if (requiredCode && !sameString(input.code, requiredCode)) {
    return { fieldErrors: { code: ["Kode pendaftaran salah."] } };
  }

  const sessionKey = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  // Indeks unik pada email: pendaftaran ganda gagal walau dua permintaan balapan.
  const [created] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email,
      passwordHash,
      sessionKey,
      timezone: input.timezone,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (!created) {
    return { fieldErrors: { email: ["Email ini sudah terdaftar."] } };
  }

  await createSession({ userId: created.id, sessionKey });
  redirect("/dashboard");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(320),
  password: z.string().max(200),
});

// Dibandingkan saat email tidak dikenal, supaya waktu respons tidak
// membocorkan email mana yang terdaftar.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hash(crypto.randomUUID(), BCRYPT_ROUNDS));

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: LOGIN_FAILED };
  const input = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, input.email));
  if (!user) {
    await bcrypt.compare(input.password, await getDummyHash());
    return { error: LOGIN_FAILED };
  }

  const now = Date.now();
  if (user.lockedUntil && user.lockedUntil > now) {
    const minutes = Math.ceil((user.lockedUntil - now) / 60_000);
    return { error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.` };
  }

  if (!(await bcrypt.compare(input.password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    const locked = failed >= MAX_FAILED_LOGINS;
    await db
      .update(users)
      .set({
        failedLogins: locked ? 0 : failed,
        lockedUntil: locked ? now + LOCK_MINUTES * 60_000 : null,
      })
      .where(eq(users.id, user.id));
    return { error: LOGIN_FAILED };
  }

  if (user.failedLogins > 0 || user.lockedUntil) {
    await db.update(users).set({ failedLogins: 0, lockedUntil: null }).where(eq(users.id, user.id));
  }
  await createSession({ userId: user.id, sessionKey: user.sessionKey });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
