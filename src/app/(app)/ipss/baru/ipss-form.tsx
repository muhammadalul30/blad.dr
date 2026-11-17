"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { saveIpss } from "@/actions/ipss";
import { FieldError, FormMessage, SubmitButton } from "@/components/form";
import {
  IPSS_FREQUENCY_OPTIONS,
  IPSS_NOCTURIA_OPTIONS,
  IPSS_QOL_OPTIONS,
  IPSS_QOL_QUESTION,
  IPSS_QUESTIONS,
  ipssCategory,
  type IpssKey,
} from "@/lib/constants";

type Answers = Partial<Record<IpssKey, number>>;

export function IpssForm({ today }: { today: string }) {
  const [state, action] = useActionState(saveIpss, {});
  const [answers, setAnswers] = useState<Answers>({});
  const errors = state.fieldErrors ?? {};

  const answered = IPSS_QUESTIONS.filter((q) => answers[q.key] != null).length;
  const total = IPSS_QUESTIONS.reduce((sum, q) => sum + (answers[q.key] ?? 0), 0);
  const complete = answered === IPSS_QUESTIONS.length;

  return (
    <form
      action={action}
      // Skor dihitung ulang dari isi form, sehingga selalu sama dengan pilihan yang tampak.
      onChange={(event) => {
        const data = new FormData(event.currentTarget);
        const next: Answers = {};
        for (const q of IPSS_QUESTIONS) {
          const value = data.get(q.key);
          if (typeof value === "string" && value !== "") next[q.key] = Number(value);
        }
        setAnswers(next);
      }}
      className="space-y-5"
    >
      <div className="card p-4">
        <label htmlFor="takenOn" className="label">
          Tanggal pengisian
        </label>
        <input
          id="takenOn"
          name="takenOn"
          type="date"
          required
          max={today}
          defaultValue={today}
          className="input num max-w-48"
        />
        <FieldError errors={errors.takenOn} />
      </div>

      <p className="text-sm text-muted">Jawab berdasarkan keadaan Anda selama 1 bulan terakhir.</p>

      {IPSS_QUESTIONS.map((question, index) => {
        const options = question.key === "q7" ? IPSS_NOCTURIA_OPTIONS : IPSS_FREQUENCY_OPTIONS;
        return (
          <fieldset key={question.key} className="card p-4">
            <legend className="float-left mb-3 w-full text-sm font-medium">
              <span className="num mr-2 text-muted">{index + 1}.</span>
              {question.text}
            </legend>
            <div className="clear-both grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {options.map((label, value) => (
                <label key={value} className="choice">
                  <input type="radio" name={question.key} value={value} required />
                  <span className="num w-4 opacity-70">{value}</span>
                  {label}
                </label>
              ))}
            </div>
            <FieldError errors={errors[question.key]} />
          </fieldset>
        );
      })}

      <fieldset className="card p-4">
        <legend className="float-left mb-3 w-full text-sm font-medium">
          <span className="mr-2 text-muted">Kualitas hidup.</span>
          {IPSS_QOL_QUESTION}
        </legend>
        <div className="clear-both grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {IPSS_QOL_OPTIONS.map((label, value) => (
            <label key={value} className="choice">
              <input type="radio" name="qol" value={value} required />
              <span className="num w-4 opacity-70">{value}</span>
              {label}
            </label>
          ))}
        </div>
        <FieldError errors={errors.qol} />
      </fieldset>

      <div className="card p-4">
        <label htmlFor="notes" className="label">
          Catatan <span className="font-normal text-muted">(opsional)</span>
        </label>
        <textarea id="notes" name="notes" rows={2} maxLength={500} className="input" />
      </div>

      <div className="sticky bottom-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-3 md:bottom-4">
        <p className="text-sm" aria-live="polite">
          Skor <span className="num text-lg font-medium">{total}</span>
          <span className="text-muted"> / 35</span>
          <span className="ml-2 text-muted">
            {complete ? ipssCategory(total) : `${answered} dari ${IPSS_QUESTIONS.length} terjawab`}
          </span>
        </p>
        <div className="flex gap-2">
          <Link href="/ipss" className="btn">
            Batal
          </Link>
          <SubmitButton>Simpan</SubmitButton>
        </div>
      </div>
      <FormMessage error={state.error} />
    </form>
  );
}
