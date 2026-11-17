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
          Nama lengkap
        </label>
        <input id="name" name="name" autoComplete="name" required maxLength={100} className="input" />
        <FieldError errors={errors.name} />
      </div>
      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" />
        <FieldError errors={errors.email} />
      </div>
      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={72}
          aria-describedby="password-hint"
          className="input"
        />
        <p id="password-hint" className="mt-1 text-xs text-muted">
          Minimal 10 karakter.
        </p>
        <FieldError errors={errors.password} />
      </div>
      <div>
        <label htmlFor="confirm" className="label">
          Ulangi password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className="input"
        />
        <FieldError errors={errors.confirm} />
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
      <SubmitButton className="btn btn-primary w-full">Buat akun</SubmitButton>
    </form>
  );
}
