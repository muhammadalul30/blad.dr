"use client";

import { useActionState, useEffect, useRef } from "react";
import { register } from "@/actions/auth";
import { FieldError, FormMessage, SubmitButton } from "@/components/form";

export function RegisterForm({ needsCode }: { needsCode: boolean }) {
  const [state, action] = useActionState(register, {});
  const timezoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timezoneRef.current) {
      timezoneRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }, []);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4">
      <input ref={timezoneRef} type="hidden" name="timezone" defaultValue="Asia/Jakarta" />
      <div>
        <label htmlFor="name" className="label">
          Nama
        </label>
        <input
          id="name"
          name="name"
          autoComplete="username"
          required
          minLength={2}
          maxLength={100}
          aria-describedby="name-hint"
          className="input"
        />
        <p id="name-hint" className="mt-1 text-xs text-muted">
          Nama ini dipakai untuk masuk dan harus berbeda dari pengguna lain.
        </p>
        <FieldError errors={errors.name} />
      </div>
      {needsCode && (
        <div>
          <label htmlFor="code" className="label">
            Kode pendaftaran
          </label>
          <input id="code" name="code" type="password" autoComplete="off" required className="input" />
          <FieldError errors={errors.code} />
        </div>
      )}
      <FormMessage error={state.error} />
      <SubmitButton className="btn btn-primary w-full">Daftar</SubmitButton>
    </form>
  );
}
