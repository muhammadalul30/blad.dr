"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { FormMessage, SubmitButton } from "@/components/form";

export function LoginForm() {
  const [state, action] = useActionState(login, {});

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className="label">
          Nama
        </label>
        <input id="name" name="name" autoComplete="username" required maxLength={100} className="input" />
      </div>
      <FormMessage error={state.error} />
      <SubmitButton className="btn btn-primary w-full">Masuk</SubmitButton>
    </form>
  );
}
