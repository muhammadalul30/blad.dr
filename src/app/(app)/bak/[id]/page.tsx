import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageHeader, Section } from "@/components/ui";
import { getVoid, requireUser } from "@/lib/dal";
import { formatDay } from "@/lib/time";
import { VoidForm } from "../void-form";
import Loading from "../../loading";

export const metadata: Metadata = { title: "Ubah catatan BAK" };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function EditVoidPage(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <Content {...props} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const entry = /^\d+$/.test(id) ? await getVoid(Number(id)) : null;
  if (!entry) notFound();

  return (
    <>
      <PageHeader title="Ubah catatan BAK" description={formatDay(entry.occurredAt.slice(0, 10), "long")} />
      <Section title="Catatan" className="max-w-xl">
        <VoidForm
          entry={entry}
          fallbackTime={entry.occurredAt}
          live={false}
          sleepTime={user.sleepTime}
          wakeTime={user.wakeTime}
        />
      </Section>
    </>
  );
}
