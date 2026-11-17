"use client";

import { useActionState } from "react";
import { deleteAccount, updateProfile } from "@/actions/settings";
import { FieldError, FormMessage, SubmitButton } from "@/components/form";
import type { Profile } from "@/lib/dal";

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB (Asia/Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Asia/Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Asia/Jayapura)" },
];

export function ProfileForm({ profile, today }: { profile: Profile; today: string }) {
  const [state, action] = useActionState(updateProfile, {});
  const errors = state.fieldErrors ?? {};
  const timezones = TIMEZONES.some((t) => t.value === profile.timezone)
    ? TIMEZONES
    : [...TIMEZONES, { value: profile.timezone, label: profile.timezone }];

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Nama <span className="font-normal text-muted">(juga dipakai untuk masuk)</span>
          </label>
          <input id="name" name="name" required minLength={2} maxLength={100} defaultValue={profile.name} className="input" />
          <FieldError errors={errors.name} />
        </div>
        <div>
          <label htmlFor="birthDate" className="label">
            Tanggal lahir
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            max={today}
            defaultValue={profile.birthDate ?? ""}
            className="input num"
          />
          <FieldError errors={errors.birthDate} />
        </div>
        <div>
          <label htmlFor="sex" className="label">
            Jenis kelamin
          </label>
          <select id="sex" name="sex" defaultValue={profile.sex ?? ""} className="input">
            <option value="">Tidak diisi</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
        <div>
          <label htmlFor="timezone" className="label">
            Zona waktu
          </label>
          <select id="timezone" name="timezone" defaultValue={profile.timezone} className="input">
            {timezones.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <FieldError errors={errors.timezone} />
        </div>
        <div>
          <label htmlFor="fluidTargetMl" className="label">
            Target cairan harian <span className="font-normal text-muted">(ml)</span>
          </label>
          <input
            id="fluidTargetMl"
            name="fluidTargetMl"
            type="number"
            inputMode="numeric"
            min={500}
            max={6000}
            step={50}
            required
            defaultValue={profile.fluidTargetMl}
            className="input num"
          />
          <FieldError errors={errors.fluidTargetMl} />
        </div>
        <div>
          <label htmlFor="sleepTime" className="label">
            Jam tidur biasanya
          </label>
          <input id="sleepTime" name="sleepTime" type="time" required defaultValue={profile.sleepTime} className="input num" />
          <FieldError errors={errors.sleepTime} />
        </div>
        <div>
          <label htmlFor="wakeTime" className="label">
            Jam bangun biasanya
          </label>
          <input id="wakeTime" name="wakeTime" type="time" required defaultValue={profile.wakeTime} className="input num" />
          <FieldError errors={errors.wakeTime} />
        </div>
        <p className="text-xs text-muted sm:col-span-2">
          Jam tidur dipakai untuk mencentang otomatis “terbangun dari tidur” saat mencatat BAK. Target cairan
          sebaiknya mengikuti anjuran dokter Anda.
        </p>
        <div className="sm:col-span-2">
          <label htmlFor="medicalHistory" className="label">
            Riwayat / diagnosis <span className="font-normal text-muted">(tampil di ringkasan dokter)</span>
          </label>
          <textarea
            id="medicalHistory"
            name="medicalHistory"
            rows={3}
            maxLength={2000}
            defaultValue={profile.medicalHistory}
            className="input"
          />
          <FieldError errors={errors.medicalHistory} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="medications" className="label">
            Obat rutin <span className="font-normal text-muted">(nama, dosis, frekuensi)</span>
          </label>
          <textarea
            id="medications"
            name="medications"
            rows={3}
            maxLength={2000}
            defaultValue={profile.medications}
            className="input"
          />
          <FieldError errors={errors.medications} />
        </div>
      </div>
      <FormMessage error={state.error} ok={state.ok && "Profil tersimpan."} />
      <SubmitButton>Simpan profil</SubmitButton>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccount, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="max-w-sm space-y-4">
      <p className="text-sm text-muted">
        Menghapus akun Anda beserta seluruh catatan BAK, hidrasi, dan IPSS milik Anda. Tidak bisa dibatalkan. Ekspor data
        lebih dulu bila masih diperlukan.
      </p>
      <div>
        <label htmlFor="delete-confirm" className="label">
          Ketik HAPUS
        </label>
        <input id="delete-confirm" name="confirm" autoComplete="off" required className="input" />
        <FieldError errors={errors.confirm} />
      </div>
      <FormMessage error={state.error} />
      <SubmitButton className="btn btn-danger">Hapus akun dan semua data</SubmitButton>
    </form>
  );
}
