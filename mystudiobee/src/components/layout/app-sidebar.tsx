"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  ScrollText,
  UserCog,
  Calculator,
  LogOut,
  FolderOpen,
  CheckSquare,
  BarChart2,
  Package,
  Clock,
  FileStack,
  Layers,
  Trash2,
  Truck,
  Contact,
  Award,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createClient } from "@/lib/supabase/client";
import { isAdminTier, type Role } from "@/lib/role";

type NavEntry = { title: string; href: string; icon: React.ComponentType<{ className?: string }> };
type NavGroupDef = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavEntry[];
};

const dashboardEntry: NavEntry = { title: "Dashboard", href: "/", icon: LayoutDashboard };
const clientsEntry: NavEntry = { title: "Clients", href: "/clients", icon: Users };
const projectsEntry: NavEntry = { title: "Projects", href: "/projects", icon: FolderOpen };
const tasksEntry: NavEntry = { title: "Tasks", href: "/tasks", icon: CheckSquare };
const clockEntry: NavEntry = { title: "Clock In", href: "/clock", icon: Clock };
const performanceEntry: NavEntry = { title: "Performance", href: "/performance", icon: Award };

const billingItems: NavEntry[] = [
  { title: "Quotes", href: "/quotes", icon: FileText },
  { title: "Proforma Invoices", href: "/proformas", icon: FileStack },
  { title: "Invoices", href: "/invoices", icon: Receipt },
  { title: "Receipts", href: "/receipts", icon: ScrollText },
];

const adminItems: NavEntry[] = [
  { title: "Team", href: "/admin/team", icon: UserCog },
  { title: "Services", href: "/admin/services", icon: Layers },
  { title: "Cost Model", href: "/admin/cost-model", icon: Calculator },
  { title: "Equipment", href: "/admin/equipment", icon: Package },
  { title: "Equipment Vendors", href: "/admin/vendors", icon: Truck },
  { title: "External Hires", href: "/admin/hires", icon: Contact },
  { title: "Bin", href: "/bin", icon: Trash2 },
];

const insightsItems: NavEntry[] = [
  { title: "Reports", href: "/reports", icon: BarChart2 },
  { title: "Time Log", href: "/reports/time", icon: Clock },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function TopLink({ item, active }: { item: NavEntry; active: boolean }) {
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

function NavGroupAccordion({ group, pathname }: { group: NavGroupDef; pathname: string }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const hasActiveChild = group.items.some((item) => isNavActive(pathname, item.href));
  // null = user hasn't manually toggled yet, so the group tracks whether it contains the active page
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? hasActiveChild;

  if (group.items.length === 0) return null;

  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setManualOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={`flex items-center gap-2.5 rounded-md px-3 py-[3px] font-heading text-[13px] tracking-[0.04em] transition-all duration-150 ${
              hasActiveChild
                ? "!text-white/85 font-medium"
                : "!text-white/55 font-normal hover:!text-white/85 hover:!bg-white/6"
            }`}
          >
            <group.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronRight
              className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="border-white/10">
            {group.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <SidebarMenuSubItem key={item.href}>
                  <SidebarMenuSubButton asChild isActive={active}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className={`flex items-center gap-2 font-heading text-[13px] tracking-[0.04em] ${
                        active
                          ? "!bg-white/12 !text-white font-medium"
                          : "!text-white/55 font-normal hover:!text-white/85 hover:!bg-white/6"
                      }`}
                    >
                      <item.icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : ""}`} />
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
  const isAdminTierRole = isAdminTier(role);
  const isBilling = isAdminTierRole || role === "manager";

  const workGroup: NavGroupDef = {
    key: "work",
    label: "Work",
    icon: Briefcase,
    items: isBilling ? [clientsEntry, projectsEntry, tasksEntry] : [projectsEntry, tasksEntry],
  };
  const timePerformanceGroup: NavGroupDef = {
    key: "time-performance",
    label: "Time & Performance",
    icon: Timer,
    items: [clockEntry, performanceEntry],
  };
  const billingGroup: NavGroupDef = { key: "billing", label: "Billing", icon: Wallet, items: billingItems };
  const adminGroup: NavGroupDef = { key: "admin", label: "Admin", icon: Settings, items: adminItems };
  const insightsGroup: NavGroupDef = { key: "insights", label: "Insights", icon: TrendingUp, items: insightsItems };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initial = (displayName || email || "U").charAt(0).toUpperCase();

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
              <TopLink item={dashboardEntry} active={isNavActive(pathname, "/")} />
              <NavGroupAccordion group={workGroup} pathname={pathname} />
              <NavGroupAccordion group={timePerformanceGroup} pathname={pathname} />
              {isBilling && <NavGroupAccordion group={billingGroup} pathname={pathname} />}
              {isAdminTierRole && <NavGroupAccordion group={adminGroup} pathname={pathname} />}
              {isAdminTierRole && <NavGroupAccordion group={insightsGroup} pathname={pathname} />}
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
    </Sidebar>
  );
}
