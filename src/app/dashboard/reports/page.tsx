import { getReportData } from "@/features/reports/actions/get-reports";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportCharts } from "./ReportCharts";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verificar se é Admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role?.toLowerCase() !== "admin") {
    redirect("/dashboard");
  }

  // Fetch initial report data
  const initialData = await getReportData();

  // Fetch all organizations (Clients)
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name", { ascending: true });

  // Fetch all projects
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, organization_id")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Relatórios & Métricas
        </h1>
        <p className="text-sm text-zinc-500">
          Analise o tempo investido em projetos, produtividade da equipe e
          exporte relatórios para clientes.
        </p>
      </div>

      <ReportCharts
        initialData={initialData}
        organizations={organizations || []}
        projects={projects || []}
      />
    </div>
  );
}
