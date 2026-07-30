import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MyTasksClient } from "./MyTasksClient"

export default async function MyTasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch tasks where user is assignee
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

  const tasks = assignments?.map(a => a.task).filter(Boolean) || []

  return <MyTasksClient tasks={tasks as any} />
}
