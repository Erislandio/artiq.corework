import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArchivedTasksClient } from "./ArchivedTasksClient"

export default async function ArchivedTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch all archived tasks where user is assignee or creator
  // Para simplificar, buscaremos tasks arquivadas das quais o usuário participa
  const { data: assignments, error } = await supabase
    .from("task_assignees")
    .select(`
      task:tasks (
        *,
        project:projects(name),
        column:columns(title),
        assignees:task_assignees(user:users(*))
      )
    `)
    .eq("user_id", user.id)
    .eq("task.is_archived", true)

  const tasks = assignments?.map(a => a.task).filter(Boolean) || []

  return <ArchivedTasksClient tasks={tasks as any} />
}
