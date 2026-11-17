"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Droplet, FileText, GlassWater, LayoutDashboard, Settings } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard },
  { href: "/bak", label: "Catatan BAK", short: "BAK", icon: Droplet },
  { href: "/hidrasi", label: "Hidrasi", short: "Hidrasi", icon: GlassWater },
  { href: "/ipss", label: "IPSS", short: "IPSS", icon: ClipboardList },
  { href: "/ringkasan", label: "Ringkasan dokter", short: "Ringkasan", icon: FileText },
  { href: "/pengaturan", label: "Pengaturan", short: "Atur", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-0.5">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
              active ? "bg-bg font-medium text-ink" : "text-muted hover:bg-bg hover:text-ink"
            }`}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Menu utama"
      className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITEMS.map(({ href, short, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] ${
              active ? "font-medium text-accent" : "text-muted"
            }`}
          >
            <Icon size={19} strokeWidth={1.75} aria-hidden />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
