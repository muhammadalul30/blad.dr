import type { Metadata } from "next";
import { Suspense } from "react";
import Loading from "../../loading";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { todayInTz } from "@/lib/time";
import { IpssForm } from "./ipss-form";

export const metadata: Metadata = { title: "Isi IPSS" };

export default function NewIpssPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  const user = await requireUser();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Isi IPSS" description="International Prostate Symptom Score" />
      <IpssForm today={todayInTz(user.timezone)} />
    </div>
  );
}
