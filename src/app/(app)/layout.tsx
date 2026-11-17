import { Suspense } from "react";
import { logout } from "@/actions/auth";
import { Credit } from "@/components/credit";
import { BottomNav, SideNav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface p-4 md:flex">
        <p className="mb-5 px-2.5 text-sm font-semibold tracking-wide">Genitourinaria</p>
        <Suspense>
          <SideNav />
        </Suspense>
        <div className="mt-auto border-t border-line px-2.5 pt-4">
          <form action={logout}>
            <button type="submit" className="cursor-pointer text-sm text-muted underline hover:text-ink">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 md:px-8 md:pt-8">{children}</main>
        {/* Ruang bawah di ponsel agar tidak tertutup menu bawah. */}
        <Credit className="pt-10 pb-24 md:pb-8" />
      </div>

      <Suspense>
        <BottomNav />
      </Suspense>
    </div>
  );
}
