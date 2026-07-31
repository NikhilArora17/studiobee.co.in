"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Briefcase,
  Timer,
  Wallet,
  Settings,
  TrendingUp,
  PanelLeftIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/lib/supabase/client";
import { isAdminTier, type Role } from "@/lib/role";

type NavEntry = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activePrefixes: string[];
};

const NAV: NavEntry[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, activePrefixes: ["/"] },
  { title: "Work", href: "/work", icon: Briefcase, activePrefixes: ["/work", "/clients", "/projects", "/tasks"] },
  {
    title: "Time & Performance",
    href: "/time-performance",
    icon: Timer,
    activePrefixes: ["/time-performance"],
  },
  { title: "Billing", href: "/billing", icon: Wallet, activePrefixes: ["/billing", "/quotes", "/proformas", "/invoices", "/receipts"] },
  { title: "Admin", href: "/admin", icon: Settings, activePrefixes: ["/admin"] },
  { title: "Insights", href: "/reports", icon: TrendingUp, activePrefixes: ["/reports"] },
];

function isNavActive(pathname: string, item: NavEntry) {
  return item.activePrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function NavLink({ item, active }: { item: NavEntry; active: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link
          href={item.href}
          onClick={() => {
            if (isMobile) setOpenMobile(false);
          }}
          className={`group/nav relative flex items-center gap-2.5 rounded-md px-3 py-[3px] font-heading text-[13px] tracking-[0.04em] transition-all duration-150 ${
            active
              ? "!bg-white/12 !text-white font-medium"
              : "!text-white/55 font-normal hover:!text-white/85 hover:!bg-white/6"
          }`}
        >
          {active && (
            <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
          )}
          <item.icon className={`h-4 w-4 shrink-0 ${active ? "text-primary" : ""}`} />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarToggle() {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      onClick={toggleSidebar}
      title="Collapse sidebar"
      className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
    >
      <PanelLeftIcon className="h-4 w-4" />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
}

export function AppSidebar({
  displayName,
  email,
  role,
}: {
  displayName: string;
  email: string;
  role: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminTierRole = isAdminTier(role);
  const isBilling = isAdminTierRole || role === "manager";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (displayName || email || "U").charAt(0).toUpperCase();

  const visibleNav = NAV.filter((item) => {
    if (item.href === "/billing") return isBilling;
    if (item.href === "/reports") return isBilling; // Insights: relaxed to manager+, matches /reports page gate
    if (item.href === "/admin") return isAdminTierRole;
    return true;
  });

  return (
    <Sidebar className="bg-gradient-blue">
      <SidebarHeader className="border-b border-white/8 px-5 py-2.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Image src="/studiobee-white.png" alt="StudioBee" width={120} height={30} />
          </Link>
          <SidebarToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-1.5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visibleNav.map((item) => (
                <NavLink key={item.href} item={item} active={isNavActive(pathname, item)} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/8 px-3 py-1.5">
        <div className="flex w-full items-center gap-3 rounded-lg px-2 py-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/75">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium leading-tight text-white/85">
              {displayName || email}
            </p>
            <p className="truncate text-[10px] capitalize leading-tight text-white/30">{role.replace("_", " ")}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1.5 transition-colors hover:bg-white/10"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 text-white/40 transition-colors hover:text-white/80" />
          </button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
