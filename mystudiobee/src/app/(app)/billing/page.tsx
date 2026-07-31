import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DocumentList } from "@/components/documents/document-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentProfile, isBillingRole, canSeeCost } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

const DOC_SELECT = "id, number, project_name, status, total, clients(name)";

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  if (!profile || !isBillingRole(profile.role)) redirect("/");

  const supabase = await createClient();
  const [{ data: quotes }, { data: proformas }, { data: invoices }, { data: receipts }] = await Promise.all([
    supabase.from("documents").select(DOC_SELECT).eq("type", "quote").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("documents").select(DOC_SELECT).eq("type", "proforma").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("documents").select(DOC_SELECT).eq("type", "invoice").is("deleted_at", null).order("created_at", { ascending: false }),
    supabase.from("documents").select(DOC_SELECT).eq("type", "receipt").is("deleted_at", null).order("created_at", { ascending: false }),
  ]);

  const canDelete = canSeeCost(profile.role);

  return (
    <>
      <DashboardHeader title="Billing" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="animate-in-page mx-auto max-w-5xl">
          <Tabs defaultValue="quotes">
            <TabsList>
              <TabsTrigger value="quotes">Quotes</TabsTrigger>
              <TabsTrigger value="proformas">Proforma Invoices</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="receipts">Receipts</TabsTrigger>
            </TabsList>
            <TabsContent value="quotes" className="mt-4">
              <div className="mb-3 flex justify-end">
                <Link
                  href="/quotes/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-3.5 w-3.5" /> New quote
                </Link>
              </div>
              <DocumentList docs={quotes ?? []} basePath="/quotes" emptyText="No quotes yet." canDelete={canDelete} />
            </TabsContent>
            <TabsContent value="proformas" className="mt-4">
              <DocumentList
                docs={proformas ?? []}
                basePath="/proformas"
                emptyText="No proforma invoices yet — convert an accepted quote to create one."
                canDelete={canDelete}
              />
            </TabsContent>
            <TabsContent value="invoices" className="mt-4">
              <DocumentList
                docs={invoices ?? []}
                basePath="/invoices"
                emptyText="No invoices yet — convert a quote to create one."
                canDelete={canDelete}
              />
            </TabsContent>
            <TabsContent value="receipts" className="mt-4">
              <DocumentList
                docs={receipts ?? []}
                basePath="/receipts"
                emptyText="No receipts yet — convert an invoice to create one."
                canDelete={canDelete}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
