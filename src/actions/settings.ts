"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { intakes, ipssEntries, users, voids } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { invalid, requiredInt, type FormState } from "@/lib/form";
import { createSession, deleteSession } from "@/lib/session";
import { TIME_RE, isRealDate, isValidTimezone, todayInTz } from "@/lib/time";

const longText = z.string().trim().max(2000, "Maksimal 2000 karakter.").default("");

const profileSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(100),
  birthDate: z
    .string()
    .transform((value) => value || null)
    .refine((value) => value == null || isRealDate(value), "Tanggal tidak valid."),
  sex: z.enum(["L", "P", ""]).transform((value) => value || null),
  timezone: z.string().refine(isValidTimezone, "Zona waktu tidak valid."),
  fluidTargetMl: requiredInt(500, 6000, "Isi 500–6000 ml."),
  sleepTime: z.string().regex(TIME_RE, "Jam tidak valid."),
  wakeTime: z.string().regex(TIME_RE, "Jam tidak valid."),
  medicalHistory: longText,
  medications: longText,
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (parsed.data.birthDate && parsed.data.birthDate > todayInTz(parsed.data.timezone)) {
    return { fieldErrors: { birthDate: ["Tanggal lahir tidak boleh di masa depan."] } };
  }

  await db.update(users).set(parsed.data).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

const passwordSchema = z
  .object({
    current: z.string().max(200),
    password: z.string().min(10, "Minimal 10 karakter.").max(72, "Maksimal 72 karakter."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Konfirmasi tidak sama dengan password baru.",
  });

async function passwordMatches(userId: number, password: string): Promise<boolean> {
  const [row] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, userId));
  return row ? bcrypt.compare(password, row.hash) : false;
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  if (!(await passwordMatches(user.id, parsed.data.current))) {
    return { fieldErrors: { current: ["Password saat ini salah."] } };
  }

  // Kunci sesi baru: perangkat lain milik akun ini otomatis keluar.
  const sessionKey = crypto.randomUUID();
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.password, 12), sessionKey })
    .where(eq(users.id, user.id));
  await createSession({ userId: user.id, sessionKey });
  return { ok: true };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const password = String(formData.get("password") ?? "");
  if (formData.get("confirm") !== "HAPUS") {
    return { fieldErrors: { confirm: ["Ketik HAPUS untuk melanjutkan."] } };
  }
  if (!(await passwordMatches(user.id, password))) {
    return { fieldErrors: { password: ["Password salah."] } };
  }

  // Hanya baris milik akun ini. Dihapus eksplisit, tidak bergantung pada ON DELETE CASCADE.
  await db.batch([
    db.delete(voids).where(eq(voids.userId, user.id)),
    db.delete(intakes).where(eq(intakes.userId, user.id)),
    db.delete(ipssEntries).where(eq(ipssEntries.userId, user.id)),
    db.delete(users).where(eq(users.id, user.id)),
  ]);
  await deleteSession();
  redirect("/register");
}
