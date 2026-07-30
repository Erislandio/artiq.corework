"use server"

import { createClient } from "@/lib/supabase/server"

export async function getMonthlyTimeLogs(userId: string, year: number, month: number) {
  const supabase = await createClient()

  const startDate = new Date(year, month, 1).toISOString()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from("time_logs")
    .select("start_time, duration_minutes")
    .eq("user_id", userId)
    .gte("start_time", startDate)
    .lte("start_time", endDate)

  if (error) {
    console.error("Erro ao buscar horas do mês:", error)
    return []
  }

  return data
}

export async function getDailyTimeLogs(userId: string, dateIso: string) {
  const supabase = await createClient()
  
  const date = new Date(dateIso)
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString()

  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      id,
      start_time,
      end_time,
      duration_minutes,
      description,
      task:tasks(id, title, project:projects(id, name))
    `)
    .eq("user_id", userId)
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Erro ao buscar horas do dia:", error)
    return []
  }

  return data
}

export async function getActiveTasks() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("task_assignees")
    .select(`
      task:tasks (
        id,
        title,
        project:projects(id, name)
      )
    `)
    .eq("user_id", user.id)
    .eq("task.is_archived", false)

  if (error) {
    console.error("Erro ao buscar active tasks:", error)
    return []
  }

  const tasks = data.map(d => d.task).filter(Boolean)
  return tasks
}

export async function addManualTimeForDate(taskId: string, durationMinutes: number, description: string, dateIso: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const durationSeconds = durationMinutes * 60
  
  const targetDate = new Date(dateIso)
  targetDate.setHours(12, 0, 0, 0)

  const { error } = await supabase
    .from("time_logs")
    .insert({
      task_id: taskId,
      user_id: user.id,
      start_time: targetDate.toISOString(),
      end_time: new Date(targetDate.getTime() + durationSeconds * 1000).toISOString(),
      duration_minutes: durationMinutes,
      description
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getAdminMonthlyTimeLogs(year: number, month: number, projectId?: string, orgId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "Admin") return []

  const startDate = new Date(year, month, 1).toISOString()
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      start_time, 
      duration_minutes,
      task:tasks (
        id,
        project:projects (
          id,
          organization_id
        )
      )
    `)
    .gte("start_time", startDate)
    .lte("start_time", endDate)

  if (error) {
    console.error("Erro ao buscar horas da equipe do mês:", error)
    return []
  }

  return data.filter((log: any) => {
    if (projectId && projectId !== "all" && log.task?.project?.id !== projectId) return false;
    if (orgId && orgId !== "all" && log.task?.project?.organization_id !== orgId) return false;
    return true;
  })
}

export async function getAdminDailyTimeLogs(dateIso: string, projectId?: string, orgId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "Admin") return []
  
  const date = new Date(dateIso)
  const startOfDay = new Date(date.setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(date.setHours(23, 59, 59, 999)).toISOString()

  const { data, error } = await supabase
    .from("time_logs")
    .select(`
      id,
      start_time,
      end_time,
      duration_minutes,
      description,
      user:users (id, name, avatar),
      task:tasks (
        id, title, 
        project:projects(id, name, organization_id)
      )
    `)
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay)
    .order("start_time", { ascending: false })

  if (error) {
    console.error("Erro ao buscar horas diárias da equipe:", error)
    return []
  }

  return data.filter((log: any) => {
    if (projectId && projectId !== "all" && log.task?.project?.id !== projectId) return false;
    if (orgId && orgId !== "all" && log.task?.project?.organization_id !== orgId) return false;
    return true;
  })
}
