"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { intakes, ipssEntries, users, voids } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { invalid, requiredInt, type FormState } from "@/lib/form";
import { loginKeyOf, nameSchema } from "@/lib/names";
import { deleteSession } from "@/lib/session";
import { TIME_RE, isRealDate, isValidTimezone, todayInTz } from "@/lib/time";

const longText = z.string().trim().max(2000, "Maksimal 2000 karakter.").default("");

const profileSchema = z.object({
  name: nameSchema,
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

  const loginKey = loginKeyOf(parsed.data.name);
  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.loginKey, loginKey), ne(users.id, user.id)));
  if (taken) return { fieldErrors: { name: ["Nama ini sudah dipakai pengguna lain."] } };

  // Nama sekaligus kunci login, jadi keduanya diperbarui bersama.
  await db
    .update(users)
    .set({ ...parsed.data, loginKey })
    .where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (formData.get("confirm") !== "HAPUS") {
    return { fieldErrors: { confirm: ["Ketik HAPUS untuk melanjutkan."] } };
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
