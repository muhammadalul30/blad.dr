import { Suspense } from "react";
import { logout } from "@/actions/auth";
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

      <main className="mx-auto w-full max-w-5xl px-4 pt-5 pb-24 md:px-8 md:pt-8 md:pb-12">{children}</main>

      <Suspense>
        <BottomNav />
      </Suspense>
    </div>
  );
}
