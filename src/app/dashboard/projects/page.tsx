import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { CreateProjectModal } from "@/features/projects/components/CreateProjectModal";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Buscar os projetos
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("*, organizations(name)")
    .order("created_at", { ascending: false });

  // Buscar as organizações para o modal de criação
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Projetos</h1>
        <CreateProjectModal organizations={organizations || []} />
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
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-300">
                        {project.organizations?.name}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {project.status}
                      </span>
                    </div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>
                      {project.description || "Sem descrição"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
