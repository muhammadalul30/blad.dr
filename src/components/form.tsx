"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? "Menyimpan…" : children}
    </button>
  );
}

/** Tombol submit yang meminta konfirmasi dulu; dipakai untuk hapus. */
export function ConfirmButton({
  children,
  message,
  className = "btn btn-sm",
  label,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  label?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-label={label}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-danger">{errors[0]}</p>;
}

export function FormMessage({ error, ok }: { error?: string; ok?: string | false }) {
  if (error) {
    return (
      <p role="alert" className="rounded-md border border-danger px-3 py-2 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p role="status" className="text-sm text-ok">
        {ok}
      </p>
    );
  }
  return null;
}

function browserNow(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Input tanggal-jam. `fallback` dihitung server dari zona waktu profil;
 * bila `live`, nilainya diganti jam perangkat saat halaman dibuka dan lewat
 * tombol "Sekarang", supaya form yang lama terbuka tidak memakai jam basi.
 */
export function DateTimeField({
  name,
  fallback,
  live,
  onTimeChange,
}: {
  name: string;
  fallback: string;
  live: boolean;
  onTimeChange?: (value: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!live || !ref.current) return;
    ref.current.value = browserNow();
    onTimeChange?.(ref.current.value);
    // Hanya saat mount: setelah itu nilai milik pengguna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={ref}
        id={name}
        name={name}
        type="datetime-local"
        required
        defaultValue={fallback}
        onChange={(event) => onTimeChange?.(event.target.value)}
        className="input num min-w-0 flex-1 basis-52"
      />
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (!ref.current) return;
          ref.current.value = browserNow();
          onTimeChange?.(ref.current.value);
        }}
      >
        Sekarang
      </button>
    </div>
  );
}
