"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  SlidersHorizontal,
  Users,
  Warehouse,
  Truck
} from "lucide-react";
import type { NavItem } from "@/lib/nav";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

const ICONS = {
  dashboard: LayoutDashboard,
  package: Package,
  users: Users,
  calendar: CalendarDays,
  warehouse: Warehouse,
  sliders: SlidersHorizontal,
  truck: Truck,
};

export default function Shell({
  roleLabel,
  nav,
  user,
  badges = {},
  children,
}: {
  roleLabel: string;
  nav: NavItem[];
  user: { nom: string };
  badges?: Record<string, number>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const home = nav[0].href;

  const isActive = (href: string) =>
    href === home ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initiales = user.nom
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
          R
        </div>
        <div>
          <p className="font-bold leading-tight text-white">RMS</p>
          <p className="text-[10px] font-semibold tracking-widest text-slate-400">DISTRIBUTION</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          Espace {roleLabel.toLowerCase()}
        </p>
        {nav.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          const badge = badges[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-blue-500 bg-slate-800 text-white"
                  : "border-transparent hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {badge ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-800 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
          {initiales}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user.nom}</p>
          <p className="text-xs text-slate-400">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmOpen(true);
          }}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:block">{sidebar}</div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <p className="text-sm text-slate-500">
            RMS Distribution <span className="mx-1 text-slate-300">/</span>
            <span className="font-semibold text-slate-900">Espace {roleLabel.toLowerCase()}</span>
          </p>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Se déconnecter ?"
        subtitle="Vous devrez saisir à nouveau votre identifiant et votre mot de passe."
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={logout} disabled={loggingOut}>
            {loggingOut ? "Déconnexion..." : "Se déconnecter"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}