"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveVoid } from "@/actions/records";
import { DateTimeField, FieldError, FormMessage, SubmitButton } from "@/components/form";
import type { VoidRow } from "@/db/schema";
import { LEAKAGE, SYMPTOMS, URGENCY, URINE_COLORS } from "@/lib/constants";
import { isSleepHour, timeOf } from "@/lib/time";

type Props = {
  entry?: VoidRow;
  /** Nilai awal waktu bila bukan mode edit. */
  fallbackTime: string;
  /** Ganti nilai awal dengan jam perangkat saat dibuka. */
  live: boolean;
  sleepTime: string;
  wakeTime: string;
};

export function VoidForm({ entry, fallbackTime, live, sleepTime, wakeTime }: Props) {
  const [state, action] = useActionState(saveVoid, {});
  const initialTime = entry?.occurredAt ?? fallbackTime;
  // Centang "terbangun dari tidur" mengikuti jam sampai pengguna mengubahnya sendiri.
  const [woke, setWoke] = useState(
    entry ? entry.wokeFromSleep : isSleepHour(timeOf(initialTime), sleepTime, wakeTime),
  );
  const [wokeTouched, setWokeTouched] = useState(Boolean(entry));
  const errors = state.fieldErrors ?? {};
  const hasDetail = Boolean(
    entry && (entry.color != null || entry.notes || SYMPTOMS.some((s) => entry[s.key])),
  );

  return (
    <form action={action} className="space-y-5">
      {entry && <input type="hidden" name="id" value={entry.id} />}

      <div>
        <label htmlFor="occurredAt" className="label">
          Waktu
        </label>
        <DateTimeField
          name="occurredAt"
          fallback={initialTime}
          live={live && !entry}
          onTimeChange={(value) => {
            if (!wokeTouched && value.length >= 16) {
              setWoke(isSleepHour(timeOf(value), sleepTime, wakeTime));
            }
          }}
        />
        <FieldError errors={errors.occurredAt} />
      </div>

      <div>
        <label htmlFor="volumeMl" className="label">
          Volume <span className="font-normal text-muted">(ml, kosongkan bila tidak diukur)</span>
        </label>
        <input
          id="volumeMl"
          name="volumeMl"
          type="number"
          inputMode="numeric"
          min={1}
          max={2000}
          step={1}
          defaultValue={entry?.volumeMl ?? ""}
          className="input num max-w-40"
        />
        <FieldError errors={errors.volumeMl} />
      </div>

      <fieldset>
        <legend className="label">Desakan (urgensi)</legend>
        <div className="grid gap-1.5">
          {URGENCY.map((label, value) => (
            <label key={value} className="choice">
              <input type="radio" name="urgency" value={value} defaultChecked={(entry?.urgency ?? 0) === value} />
              <span className="num w-4 opacity-70">{value}</span>
              {label}
            </label>
          ))}
        </div>
        <FieldError errors={errors.urgency} />
      </fieldset>

      <fieldset>
        <legend className="label">Bocor / mengompol</legend>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {LEAKAGE.map((label, value) => (
            <label key={value} className="choice">
              <input type="radio" name="leakage" value={value} defaultChecked={(entry?.leakage ?? 0) === value} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          name="wokeFromSleep"
          checked={woke}
          onChange={(event) => {
            setWoke(event.target.checked);
            setWokeTouched(true);
          }}
          className="mt-0.5 size-4 accent-(--accent)"
        />
        <span>
          Terbangun dari tidur untuk BAK <span className="text-muted">(dihitung sebagai nokturia)</span>
        </span>
      </label>

      <details open={hasDetail} className="rounded-md border border-line">
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">Warna, gejala, catatan</summary>
        <div className="space-y-5 border-t border-line p-3">
          <fieldset>
            <legend className="label">Warna urin</legend>
            <div className="flex flex-wrap gap-1.5">
              <label className="choice">
                <input type="radio" name="color" value="" defaultChecked={entry?.color == null} />
                Tidak diamati
              </label>
              {URINE_COLORS.map((c) => (
                <label key={c.value} className="choice px-2" title={c.label}>
                  <input type="radio" name="color" value={c.value} defaultChecked={entry?.color === c.value} />
                  <span
                    className="block size-6 rounded-sm border border-black/20"
                    style={{ background: c.hex }}
                    aria-hidden
                  />
                  <span className="sr-only">{c.label}</span>
                  <span className="num text-xs" aria-hidden>
                    {c.value}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">1 paling jernih, 8 paling pekat.</p>
          </fieldset>

          <fieldset>
            <legend className="label">Gejala saat BAK</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {SYMPTOMS.map((s) => (
                <label key={s.key} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    name={s.key}
                    defaultChecked={entry?.[s.key] ?? false}
                    className="size-4 accent-(--accent)"
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="notes" className="label">
              Catatan
            </label>
            <textarea id="notes" name="notes" rows={2} maxLength={500} defaultValue={entry?.notes ?? ""} className="input" />
            <FieldError errors={errors.notes} />
          </div>
        </div>
      </details>

      <FormMessage error={state.error} ok={state.ok && "Tersimpan."} />
      <div className="flex gap-2">
        <SubmitButton>{entry ? "Simpan perubahan" : "Simpan"}</SubmitButton>
        {entry && (
          <Link href={`/bak?tgl=${entry.occurredAt.slice(0, 10)}`} className="btn">
            Batal
          </Link>
        )}
      </div>
    </form>
  );
}
