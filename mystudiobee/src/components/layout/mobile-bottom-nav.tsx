"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, isNavActive } from "./app-sidebar";
import { isAdminTier, isBillingRole, type Role } from "@/lib/role";

export function MobileBottomNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const isAdminTierRole = isAdminTier(role);
  const isBilling = isBillingRole(role);

  const visibleNav = NAV.filter((item) => {
    if (item.href === "/billing") return isBilling;
    if (item.href === "/reports") return isBilling;
    if (item.href === "/admin") return isAdminTierRole;
    return true;
  });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <div className="flex items-center gap-0.5 rounded-2xl border border-white/10 bg-[#0A0A0A]/95 p-1.5 shadow-elevated backdrop-blur-xl">
        {visibleNav.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-90`}
            >
              {active && <span aria-hidden className="absolute inset-0 rounded-xl bg-white/12" />}
              <item.icon
                className={`relative h-[18px] w-[18px] transition-colors duration-150 ${
                  active ? "text-primary" : "text-white/45 group-hover:text-white/80"
                }`}
              />
              <span className="sr-only">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
