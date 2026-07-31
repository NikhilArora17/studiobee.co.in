import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentProfile, isBillingRole } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { ClientsClient } from "../clients/clients-client";
import { ProjectsClient } from "../projects/projects-client";
import { TasksClient } from "../tasks/tasks-client";

const LIFECYCLE_ORDER: Record<string, number> = {
  active: 0,
  on_hold: 1,
  completed: 2,
  cancelled: 3,
};

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string; status?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { new: openNew, status } = await searchParams;
  const isBilling = isBillingRole(profile.role);
  const canCreateProject = profile.role !== "employee";
  const isEmployee = profile.role === "employee";

  const supabase = await createClient();

  const [clientsResult, projectsResult, tasksResult, taskProjectsResult, teamMembersResult] = await Promise.all([
    isBilling
      ? supabase.from("clients").select("id, name, contact_person, email, phone, city, tags, avatar_url").is("deleted_at", null).order("name")
      : Promise.resolve({ data: [] }),
    supabase
      .from("projects")
      .select("id, name, type, status, category, est_hours, created_at, clients(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    (() => {
      let query = supabase
        .from("tasks")
        .select("*, projects(name), profiles!assigned_to(display_name, email)")
        .is("deleted_at", null)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (isEmployee) query = query.eq("assigned_to", profile.id);
      return query;
    })(),
    supabase.from("projects").select("id, name").eq("status", "active").is("deleted_at", null).order("name"),
    supabase.from("profiles").select("id, display_name, email").eq("active", true).order("display_name"),
  ]);

  const sortedProjects = [...(projectsResult.data ?? [])].sort((a, b) => {
    const lifecycleDiff = (LIFECYCLE_ORDER[a.status] ?? 99) - (LIFECYCLE_ORDER[b.status] ?? 99);
    if (lifecycleDiff !== 0) return lifecycleDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const defaultTab = openNew === "1" && isBilling ? "clients" : status ? "tasks" : "projects";

  return (
    <>
      <DashboardHeader title="Work" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {isBilling && <TabsTrigger value="clients">Clients</TabsTrigger>}
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>
          {isBilling && (
            <TabsContent value="clients" className="mt-4">
              <div className="animate-in-page mx-auto max-w-5xl">
                <ClientsClient clients={clientsResult.data ?? []} openNewOnLoad={openNew === "1"} />
              </div>
            </TabsContent>
          )}
          <TabsContent value="projects" className="mt-4">
            {canCreateProject && (
              <div className="mb-3 flex justify-end">
                <Link
                  href="/projects/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> New Project
                </Link>
              </div>
            )}
            <ProjectsClient projects={sortedProjects as never} />
          </TabsContent>
          <TabsContent value="tasks" className="mt-4">
            <TasksClient
              tasks={tasksResult.data ?? []}
              initialStatus={status}
              projects={taskProjectsResult.data ?? []}
              teamMembers={teamMembersResult.data ?? []}
              currentUserId={profile.id}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
