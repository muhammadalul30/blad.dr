"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { intakes, voids } from "@/db/schema";
import { DRINK_VALUES } from "@/lib/constants";
import { requireUser } from "@/lib/dal";
import { checkbox, invalid, notes, optionalInt, requiredInt, type FormState } from "@/lib/form";
import { DATETIME_RE, addDays, dayOf, isRealDate, nowInTz, todayInTz } from "@/lib/time";

const MAX_ID = Number.MAX_SAFE_INTEGER;

const occurredAt = z
  .string()
  .regex(DATETIME_RE, "Waktu tidak valid.")
  .refine((value) => isRealDate(dayOf(value)), "Waktu tidak valid.");

/** Toleransi satu hari untuk perangkat yang zona waktunya beda dari profil. */
function inFuture(value: string, timezone: string): boolean {
  return dayOf(value) > addDays(todayInTz(timezone), 1);
}

// Setiap ubah/hapus menyaring dengan id pengguna dari sesi, sehingga id catatan
// milik orang lain tidak pernah cocok.

function refresh() {
  revalidatePath("/", "layout");
}

const voidSchema = z.object({
  id: optionalInt(1, MAX_ID, "ID tidak valid."),
  occurredAt,
  volumeMl: optionalInt(1, 2000, "Isi 1–2000 ml, atau kosongkan bila tidak diukur."),
  urgency: requiredInt(0, 4, "Pilih tingkat desakan."),
  leakage: requiredInt(0, 3, "Pilih tingkat bocor."),
  wokeFromSleep: checkbox,
  color: optionalInt(1, 8, "Warna tidak valid."),
  pain: checkbox,
  hematuria: checkbox,
  weakStream: checkbox,
  straining: checkbox,
  intermittent: checkbox,
  incomplete: checkbox,
  notes,
});

export async function saveVoid(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = voidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  if (inFuture(values.occurredAt, user.timezone)) {
    return { fieldErrors: { occurredAt: ["Waktu tidak boleh di masa depan."] } };
  }

  if (id == null) {
    await db.insert(voids).values({ ...values, userId: user.id });
    refresh();
    return { ok: true };
  }
  await db
    .update(voids)
    .set(values)
    .where(and(eq(voids.id, id), eq(voids.userId, user.id)));
  refresh();
  redirect(`/bak?tgl=${dayOf(values.occurredAt)}`);
}

const idSchema = z.object({ id: requiredInt(1, MAX_ID, "ID tidak valid.") });

export async function deleteVoid(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db.delete(voids).where(and(eq(voids.id, parsed.data.id), eq(voids.userId, user.id)));
  refresh();
}

const intakeSchema = z.object({
  id: optionalInt(1, MAX_ID, "ID tidak valid."),
  occurredAt,
  volumeMl: requiredInt(1, 3000, "Isi 1–3000 ml."),
  kind: z.enum(DRINK_VALUES, "Pilih jenis minuman."),
  notes,
});

export async function saveIntake(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = intakeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...values } = parsed.data;
  if (inFuture(values.occurredAt, user.timezone)) {
    return { fieldErrors: { occurredAt: ["Waktu tidak boleh di masa depan."] } };
  }

  if (id == null) {
    await db.insert(intakes).values({ ...values, userId: user.id });
    refresh();
    return { ok: true };
  }
  await db
    .update(intakes)
    .set(values)
    .where(and(eq(intakes.id, id), eq(intakes.userId, user.id)));
  refresh();
  redirect(`/hidrasi?tgl=${dayOf(values.occurredAt)}`);
}

const quickSchema = z.object({
  volumeMl: requiredInt(1, 3000, "Volume tidak valid."),
  kind: z.enum(DRINK_VALUES),
});

/** Catat minum pada jam sekarang (zona waktu profil) dengan satu ketukan. */
export async function quickIntake(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = quickSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db
    .insert(intakes)
    .values({ ...parsed.data, userId: user.id, occurredAt: nowInTz(user.timezone) });
  refresh();
}

export async function deleteIntake(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  await db
    .delete(intakes)
    .where(and(eq(intakes.id, parsed.data.id), eq(intakes.userId, user.id)));
  refresh();
}
