"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Briefcase,
  Timer,
  Wallet,
  Settings,
  TrendingUp,
  ChevronRight,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createClient } from "@/lib/supabase/client";
import { isAdminTier, type Role } from "@/lib/role";

type SubItem = { title: string; tab: string };
export type NavGroupDef = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  activePrefixes: string[];
  subItems?: SubItem[];
};

export const NAV: NavGroupDef[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard, activePrefixes: ["/"] },
  {
    title: "Work",
    href: "/work",
    icon: Briefcase,
    activePrefixes: ["/work", "/clients", "/projects", "/tasks"],
    subItems: [
      { title: "Clients", tab: "clients" },
      { title: "Projects", tab: "projects" },
      { title: "Tasks", tab: "tasks" },
    ],
  },
  {
    title: "Time & Performance",
    href: "/time-performance",
    icon: Timer,
    activePrefixes: ["/time-performance"],
    subItems: [
      { title: "Clock In", tab: "clock" },
      { title: "Performance", tab: "performance" },
    ],
  },
  {
    title: "Billing",
    href: "/billing",
    icon: Wallet,
    activePrefixes: ["/billing", "/quotes", "/proformas", "/invoices", "/receipts"],
    subItems: [
      { title: "Quotes", tab: "quotes" },
      { title: "Proforma Invoices", tab: "proformas" },
      { title: "Invoices", tab: "invoices" },
      { title: "Receipts", tab: "receipts" },
    ],
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
    activePrefixes: ["/admin"],
    subItems: [
      { title: "Team", tab: "team" },
      { title: "Services", tab: "services" },
      { title: "Cost Model", tab: "cost-model" },
      { title: "Equipment", tab: "equipment" },
      { title: "Equipment Vendors", tab: "vendors" },
      { title: "External Hires", tab: "hires" },
      { title: "Bin", tab: "bin" },
    ],
  },
  {
    title: "Insights",
    href: "/reports",
    icon: TrendingUp,
    activePrefixes: ["/reports"],
    subItems: [
      { title: "Reports", tab: "reports" },
      { title: "Time Log", tab: "time-log" },
    ],
  },
];

export function isNavActive(pathname: string, item: NavGroupDef) {
  return item.activePrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

function NavLink({ item, active }: { item: NavGroupDef; active: boolean }) {
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

function NavGroupAccordion({
  group,
  pathname,
  activeTab,
}: {
  group: NavGroupDef;
  pathname: string;
  activeTab: string | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const hasActiveChild = isNavActive(pathname, group);
  // null = user hasn't manually toggled yet, so the group tracks whether it's the active page
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? hasActiveChild;

  const items = group.subItems ?? [];
  if (items.length === 0) return null;

  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setManualOpen}>
        <div className="flex items-center gap-0.5">
          <SidebarMenuButton asChild isActive={hasActiveChild} className="flex-1">
            <Link
              href={group.href}
              onClick={() => {
                if (isMobile) setOpenMobile(false);
              }}
              className={`group/nav relative flex items-center gap-2.5 rounded-md px-3 py-[3px] font-heading text-[13px] tracking-[0.04em] transition-all duration-150 ${
                hasActiveChild
                  ? "!bg-white/12 !text-white font-medium"
                  : "!text-white/55 font-normal hover:!text-white/85 hover:!bg-white/6"
              }`}
            >
              {hasActiveChild && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <group.icon className={`h-4 w-4 shrink-0 ${hasActiveChild ? "text-primary" : ""}`} />
              <span>{group.title}</span>
            </Link>
          </SidebarMenuButton>
          <CollapsibleTrigger asChild>
            <button
              title={open ? "Collapse" : "Expand"}
              className="shrink-0 rounded-md p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
            >
              <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-90" : ""}`} />
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <SidebarMenuSub className="border-white/10">
            {items.map((item) => {
              const active = activeTab === item.tab;
              return (
                <SidebarMenuSubItem key={item.tab}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link
                      href={`${group.href}?tab=${item.tab}`}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className={`font-heading text-[13px] tracking-[0.04em] ${
                        active
                          ? "!bg-white/12 !text-white font-medium"
                          : "!text-white/55 font-normal hover:!text-white/85 hover:!bg-white/6"
                      }`}
                    >
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
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
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");
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
  }).map((item) => {
    if (item.href === "/work" && !isBilling) {
      return { ...item, subItems: item.subItems?.filter((s) => s.tab !== "clients") };
    }
    return item;
  });

  return (
    <Sidebar className="bg-gradient-blue">
      <SidebarHeader className="border-b border-white/8 px-5 py-2.5">
        <Link href="/" className="inline-flex items-center">
          <Image src="/studiobee-white.png" alt="StudioBee" width={120} height={30} />
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-1.5">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visibleNav.map((item) =>
                item.subItems ? (
                  <NavGroupAccordion key={item.href} group={item} pathname={pathname} activeTab={activeTab} />
                ) : (
                  <NavLink key={item.href} item={item} active={isNavActive(pathname, item)} />
                )
              )}
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
