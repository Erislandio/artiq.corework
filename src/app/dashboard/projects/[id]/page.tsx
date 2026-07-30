import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { KanbanBoard } from "@/features/kanban/components/KanbanBoard"
import { Column } from "@/types"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Fetch columns and nested tasks with assignees
  const { data: columnsData, error: columnsError } = await supabase
    .from("columns")
    .select(`
      *,
      tasks (
        *,
        assignees:task_assignees(user:users(*))
      )
    `)
    .eq("project_id", id)
    .eq("tasks.is_archived", false)
    .order("position", { ascending: true })

  // Sort tasks by position inside each column since Supabase doesn't guarantee nested ordering directly
  const columns: Column[] = (columnsData || []).map(col => ({
    ...col,
    tasks: (col.tasks || []).sort((a: any, b: any) => a.position - b.position)
  }))

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-zinc-500">{project.description}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="p-4 text-zinc-500">Carregando quadro...</div>}>
          <KanbanBoard projectId={project.id} initialColumns={columns} />
        </Suspense>
      </div>
    </div>
  )
}
