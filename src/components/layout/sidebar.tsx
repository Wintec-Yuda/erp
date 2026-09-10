"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import { NAV_SECTIONS } from "@/lib/nav";
import { hasMinimumRole } from "@/lib/rbac";
import { LogOut } from "lucide-react";
import clsx from "clsx";

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-lg font-semibold text-slate-900">ERP System</p>
        <p className="text-xs text-slate-500">Modern Enterprise Suite</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.minimumRole || hasMinimumRole(role, item.minimumRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="mt-2 space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition",
                        active
                          ? "bg-indigo-50 text-indigo-700"
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-800">{name}</p>
        <p className="text-xs text-slate-400">{role}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
