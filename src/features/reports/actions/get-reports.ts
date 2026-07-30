"use server"

import { createClient } from "@/lib/supabase/server"

export async function getReportData(filters?: { organizationId?: string; projectId?: string }) {
  const supabase = await createClient()

  // Fetch time logs with related task, user, project, organization
  const { data: logsData, error } = await supabase
    .from("time_logs")
    .select(`
      *,
      user:users(id, name, email),
      task:tasks(
        id, title, status, priority,
        project:projects(
          id, name, organization_id,
          organization:organizations(id, name)
        )
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Erro ao buscar logs de relatório:", error)
  }

  let filteredLogs = logsData || []

  // Filtrar em memória para flexibilidade total
  if (filters?.organizationId && filters.organizationId !== "all") {
    filteredLogs = filteredLogs.filter(
      (l: any) => l.task?.project?.organization_id === filters.organizationId
    )
  }
  if (filters?.projectId && filters.projectId !== "all") {
    filteredLogs = filteredLogs.filter(
      (l: any) => l.task?.project?.id === filters.projectId
    )
  }

  const projectHoursMap: Record<string, number> = {}
  const userHoursMap: Record<string, number> = {}
  const statusMap: Record<string, number> = {}
  let totalMinutes = 0

  filteredLogs.forEach((log: any) => {
    const mins = log.duration_minutes || 0
    totalMinutes += mins

    const projectName = log.task?.project?.name || "Sem Projeto"
    projectHoursMap[projectName] = Number(((projectHoursMap[projectName] || 0) + mins / 60).toFixed(1))

    const userName = log.user?.name || "Desconhecido"
    userHoursMap[userName] = Number(((userHoursMap[userName] || 0) + mins / 60).toFixed(1))

    const taskStatus = log.task?.status || "Aberto"
    statusMap[taskStatus] = (statusMap[taskStatus] || 0) + 1
  })

  const hoursByProject = Object.entries(projectHoursMap).map(([name, hours]) => ({ name, hours }))
  const hoursByUser = Object.entries(userHoursMap).map(([name, hours]) => ({ name, hours }))
  const tasksByStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }))

  return {
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    totalLogs: filteredLogs.length,
    hoursByProject,
    hoursByUser,
    tasksByStatus,
    logs: filteredLogs.map((l: any) => ({
      id: l.id,
      date: l.created_at,
      user: l.user?.name || "Desconhecido",
      project: l.task?.project?.name || "N/A",
      organization: l.task?.project?.organization?.name || "N/A",
      task: l.task?.title || "N/A",
      durationHours: Number(((l.duration_minutes || 0) / 60).toFixed(2)),
      description: l.description || (l.is_timer ? "Sessão de Timer" : "Apontamento manual")
    }))
  }
}
