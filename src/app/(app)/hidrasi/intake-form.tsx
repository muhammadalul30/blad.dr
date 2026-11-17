"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveIntake } from "@/actions/records";
import { DateTimeField, FieldError, FormMessage, SubmitButton } from "@/components/form";
import type { IntakeRow } from "@/db/schema";
import { DRINKS } from "@/lib/constants";

type Props = {
  entry?: IntakeRow;
  fallbackTime: string;
  live: boolean;
};

export function IntakeForm({ entry, fallbackTime, live }: Props) {
  const [state, action] = useActionState(saveIntake, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-5">
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div>
        <label htmlFor="occurredAt" className="label">
          Waktu
        </label>
        <DateTimeField name="occurredAt" fallback={entry?.occurredAt ?? fallbackTime} live={live && !entry} />
        <FieldError errors={errors.occurredAt} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="volumeMl" className="label">
            Volume <span className="font-normal text-muted">(ml)</span>
          </label>
          <input
            id="volumeMl"
            name="volumeMl"
            type="number"
            inputMode="numeric"
            min={1}
            max={3000}
            step={1}
            required
            defaultValue={entry?.volumeMl ?? ""}
            className="input num"
          />
          <FieldError errors={errors.volumeMl} />
        </div>
        <div>
          <label htmlFor="kind" className="label">
            Jenis
          </label>
          <select id="kind" name="kind" defaultValue={entry?.kind ?? "air"} className="input">
            {DRINKS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <FieldError errors={errors.kind} />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label">
          Catatan <span className="font-normal text-muted">(opsional)</span>
        </label>
        <input id="notes" name="notes" maxLength={500} defaultValue={entry?.notes ?? ""} className="input" />
        <FieldError errors={errors.notes} />
      </div>

      <FormMessage error={state.error} ok={state.ok && "Tersimpan."} />
      <div className="flex gap-2">
        <SubmitButton>{entry ? "Simpan perubahan" : "Simpan"}</SubmitButton>
        {entry && (
          <Link href={`/hidrasi?tgl=${entry.occurredAt.slice(0, 10)}`} className="btn">
            Batal
          </Link>
        )}
      </div>
    </form>
  );
}
