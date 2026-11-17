import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { RegisterForm } from "./register-form";
import Loading from "../loading";

export const metadata: Metadata = { title: "Daftar" };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Content />
    </Suspense>
  );
}

async function Content() {
  if (await getUser()) redirect("/dashboard");

  return (
    <>
      <h1 className="mb-5 text-xl font-semibold">Daftar</h1>
      <RegisterForm needsCode={Boolean(process.env.REGISTRATION_CODE)} />
      <p className="mt-5 text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-accent underline">
          Masuk
        </Link>
      </p>
    </>
  );
}
