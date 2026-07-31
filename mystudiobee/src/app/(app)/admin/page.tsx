import { redirect } from "next/navigation";
import { getCurrentProfile, isAdminTier } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TeamClient } from "./team/team-client";
import { ServicesClient } from "./services/services-client";
import { CostModelClient } from "./cost-model/cost-model-client";
import { EquipmentClient } from "./equipment/equipment-client";
import { InternalCostingClient } from "./equipment/internal-costing-client";
import { VendorsClient } from "./vendors/vendors-client";
import { HiresClient } from "./hires/hires-client";
import { BinClient } from "../bin/bin-client";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdminTier(profile.role)) {
    redirect("/");
  }

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const [
    { data: employees },
    { data: costRoles },
    { data: overheadItems },
    { data: servicePresets },
    { data: equipment },
    { data: vendors },
    { data: hires },
    { data: binClients },
  ] = await Promise.all([
    supabase.from("profiles").select("id, email, display_name, role, active, manager_id").order("email"),
    supabase.from("cost_roles").select("*").order("name"),
    supabase.from("overhead_items").select("*").order("name"),
    supabase.from("service_presets").select("*").order("category"),
    adminSupabase.from("equipment").select("*").order("name"),
    adminSupabase.from("equipment_vendors").select("*").order("overall_rating", { ascending: false, nullsFirst: false }),
    adminSupabase.from("external_hires").select("*").order("overall_rating", { ascending: false, nullsFirst: false }),
    supabase.from("clients").select("id, name, city, deleted_at").not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
  ]);

  return (
    <>
      <DashboardHeader title="Admin" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs defaultValue="team">
          <TabsList>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="cost-model">Cost Model</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="vendors">Equipment Vendors</TabsTrigger>
            <TabsTrigger value="hires">External Hires</TabsTrigger>
            <TabsTrigger value="bin">Bin</TabsTrigger>
          </TabsList>
          <TabsContent value="team" className="mt-4">
            <div className="animate-in-page mx-auto max-w-4xl">
              <TeamClient employees={employees ?? []} currentUserId={profile.id} viewerRole={profile.role} />
            </div>
          </TabsContent>
          <TabsContent value="services" className="mt-4">
            <div className="animate-in-page mx-auto max-w-5xl">
              <ServicesClient roles={costRoles ?? []} overheads={overheadItems ?? []} presets={servicePresets ?? []} />
            </div>
          </TabsContent>
          <TabsContent value="cost-model" className="mt-4">
            <div className="animate-in-page mx-auto max-w-5xl">
              <CostModelClient roles={costRoles ?? []} />
            </div>
          </TabsContent>
          <TabsContent value="equipment" className="mt-4">
            <Tabs defaultValue="equipment-list">
              <TabsList>
                <TabsTrigger value="equipment-list">Equipment</TabsTrigger>
                <TabsTrigger value="internal-costing">Internal Costing</TabsTrigger>
              </TabsList>
              <TabsContent value="equipment-list" className="mt-4">
                <EquipmentClient items={equipment ?? []} />
              </TabsContent>
              <TabsContent value="internal-costing" className="mt-4">
                <InternalCostingClient items={overheadItems ?? []} />
              </TabsContent>
            </Tabs>
          </TabsContent>
          <TabsContent value="vendors" className="mt-4">
            <VendorsClient items={vendors ?? []} />
          </TabsContent>
          <TabsContent value="hires" className="mt-4">
            <HiresClient items={hires ?? []} />
          </TabsContent>
          <TabsContent value="bin" className="mt-4">
            <div className="animate-in-page mx-auto max-w-5xl">
              <BinClient clients={binClients ?? []} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
