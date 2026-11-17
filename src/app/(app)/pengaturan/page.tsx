import type { Metadata } from "next";
import { Suspense } from "react";
import { logout } from "@/actions/auth";
import { PageHeader, Section } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { todayInTz } from "@/lib/time";
import { DeleteAccountForm, ProfileForm } from "./settings-forms";
import Loading from "../loading";

export const metadata: Metadata = { title: "Pengaturan" };

const EXPORTS = [
  { href: "/api/export?format=json", label: "Semua data (JSON)" },
  { href: "/api/export?format=csv&jenis=bak", label: "Catatan BAK (CSV)" },
  { href: "/api/export?format=csv&jenis=hidrasi", label: "Hidrasi (CSV)" },
  { href: "/api/export?format=csv&jenis=ipss", label: "IPSS (CSV)" },
];

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function SettingsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const user = await requireUser();

  return (
    <div className="max-w-3xl space-y-5">
      <PageHeader title="Pengaturan" description={user.name}>
        <form action={logout}>
          <button type="submit" className="btn">
            Keluar
          </button>
        </form>
      </PageHeader>

      <Section title="Profil">
        <ProfileForm profile={user} today={todayInTz(user.timezone)} />
      </Section>

      <Section title="Ekspor data">
        <div className="flex flex-wrap gap-2">
          {EXPORTS.map((item) => (
            // Unduhan berkas, bukan navigasi halaman.
            <a key={item.href} href={item.href} download className="btn">
              {item.label}
            </a>
          ))}
        </div>
      </Section>

      <Section title="Hapus akun">
        <DeleteAccountForm />
      </Section>
    </div>
  );
}
