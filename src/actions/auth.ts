"use server";

import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { invalid, type FormState } from "@/lib/form";
import { loginKeyOf, nameSchema } from "@/lib/names";
import { createSession, deleteSession } from "@/lib/session";
import { isValidTimezone } from "@/lib/time";

// Login dan daftar cukup dengan nama. Nama bersifat unik (tidak peka huruf
// besar/kecil) dan menjadi satu-satunya kunci akun.

const registerSchema = z.object({
  name: nameSchema,
  timezone: z.string().refine(isValidTimezone).catch("Asia/Jakarta"),
  code: z.string().default(""),
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
  // Indeks unik pada kunci nama: pendaftaran ganda gagal walau dua permintaan balapan.
  const [created] = await db
    .insert(users)
    .values({
      name: input.name,
      loginKey: loginKeyOf(input.name),
      passwordHash: "",
      sessionKey,
      timezone: input.timezone,
    })
    .onConflictDoNothing({ target: users.loginKey })
    .returning({ id: users.id });

  if (!created) {
    return { fieldErrors: { name: ["Nama ini sudah terdaftar. Pakai nama lain, atau masuk."] } };
  }

  await createSession({ userId: created.id, sessionKey });
  redirect("/dashboard");
}

const loginSchema = z.object({ name: z.string().max(200) });

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Nama tidak ditemukan." };

  const [user] = await db
    .select({ id: users.id, sessionKey: users.sessionKey })
    .from(users)
    .where(eq(users.loginKey, loginKeyOf(parsed.data.name)));
  if (!user) return { error: "Nama tidak ditemukan. Periksa ejaannya, atau daftar." };

  await createSession({ userId: user.id, sessionKey: user.sessionKey });
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
