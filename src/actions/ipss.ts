"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { ipssEntries } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { invalid, notes, requiredInt, type FormState } from "@/lib/form";
import { isRealDate, todayInTz } from "@/lib/time";

const answer = requiredInt(0, 5, "Pertanyaan ini belum dijawab.");

const ipssSchema = z.object({
  takenOn: z.string().refine(isRealDate, "Tanggal tidak valid."),
  q1: answer,
  q2: answer,
  q3: answer,
  q4: answer,
  q5: answer,
  q6: answer,
  q7: answer,
  qol: requiredInt(0, 6, "Pertanyaan ini belum dijawab."),
  notes,
});

export async function saveIpss(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ipssSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ...invalid(parsed.error), error: "Masih ada pertanyaan yang belum dijawab." };
  }
  const values = parsed.data;
  if (values.takenOn > todayInTz(user.timezone)) {
    return { fieldErrors: { takenOn: ["Tanggal tidak boleh di masa depan."] } };
  }

  const total = values.q1 + values.q2 + values.q3 + values.q4 + values.q5 + values.q6 + values.q7;
  await db.insert(ipssEntries).values({ ...values, total, userId: user.id });
  revalidatePath("/", "layout");
  redirect("/ipss");
}

export async function deleteIpss(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return;
  await db.delete(ipssEntries).where(and(eq(ipssEntries.id, id), eq(ipssEntries.userId, user.id)));
  revalidatePath("/", "layout");
}
