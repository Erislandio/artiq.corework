import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CreateProjectModal } from "@/features/projects/components/CreateProjectModal";
import { DeleteProjectButton } from "@/features/projects/components/DeleteProjectButton";
import { ProjectOrgFilter } from "@/features/projects/components/ProjectOrgFilter";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface ProjectsPageProps {
  searchParams: Promise<{ org?: string }>
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const supabase = await createClient();
  const { org } = await searchParams;

  // Buscar os projetos
  let query = supabase
    .from("projects")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });

  if (org && org !== "all") {
    query = query.eq("organization_id", org);
  }

  const { data: projects, error: projectsError } = await query;

  // Buscar as organizações para o modal de criação e para o filtro
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <div className="flex items-center gap-4">
          <ProjectOrgFilter organizations={organizations || []} />
          <CreateProjectModal organizations={organizations || []} />
        </div>
      </div>

      {projectsError ? (
        <div className="p-4 text-sm text-red-500 bg-red-100 rounded-md">
          Erro ao carregar projetos: {projectsError.message}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects?.length === 0 ? (
            <div className="col-span-full py-12 text-center border rounded-lg border-dashed">
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                Nenhum projeto encontrado
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Crie um novo projeto para começar.
              </p>
            </div>
          ) : (
            projects?.map((project) => (
              <Card key={project.id} className="relative group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <Link href={`/dashboard/projects/${project.id}`} className="absolute inset-0 z-0" />
                <CardHeader className="relative z-10 pointer-events-none">
                  <div className="flex items-center justify-between mb-1 pointer-events-auto">
                    <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">
                      {project.organizations?.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">
                        {project.status}
                      </span>
                      <DeleteProjectButton projectId={project.id} projectName={project.name} />
                    </div>
                  </div>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project.description || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
