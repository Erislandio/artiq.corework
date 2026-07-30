"use server"

import { createClient } from "@/lib/supabase/server"

export async function getActiveTeamTimers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "Admin") return []

  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      id,
      start_time,
      description,
      user_id,
      user:users (id, name, avatar, job_title),
      task_id,
      task:tasks (
        id,
        title,
        project_id,
        project:projects (
          id,
          name,
          organization_id,
          organization:organizations (id, name)
        )
      )
    `)
    .eq("is_timer", true)
    .is("end_time", null)
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Erro ao buscar timers ativos da equipe:", error)
    return []
  }

  return data
}
