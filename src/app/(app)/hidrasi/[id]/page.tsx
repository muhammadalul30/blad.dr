import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader, Section } from "@/components/ui";
import { getIntake } from "@/lib/dal";
import { formatDay } from "@/lib/time";
import { IntakeForm } from "../intake-form";
import Loading from "../../loading";

export const metadata: Metadata = { title: "Ubah catatan minum" };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function EditIntakePage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = /^\d+$/.test(id) ? await getIntake(Number(id)) : null;
  if (!entry) notFound();

  return (
    <>
      <PageHeader title="Ubah catatan minum" description={formatDay(entry.occurredAt.slice(0, 10), "long")} />
      <Section title="Catatan" className="max-w-xl">
        <IntakeForm entry={entry} fallbackTime={entry.occurredAt} live={false} />
      </Section>
    </>
  );
}
