import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/dal";
import { LoginForm } from "./login-form";
import Loading from "../loading";

export const metadata: Metadata = { title: "Masuk" };

// Pembacaan sesi dan data ada di dalam Suspense agar kerangka halaman tampil seketika.
export default function LoginPage() {
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
      <h1 className="mb-5 text-xl font-semibold">Masuk</h1>
      <LoginForm />
      <p className="mt-5 text-sm text-muted">
        Belum punya akun?{" "}
        <Link href="/register" className="text-accent underline">
          Daftar
        </Link>
      </p>
    </>
  );
}
