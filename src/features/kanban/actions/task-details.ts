"use server"

import { createClient } from "@/lib/supabase/server"

import { createNotification } from "@/features/notifications/actions/notifications"

export async function updateTaskDetails(
  taskId: string, 
  data: { description?: string; priority?: string; story_points?: number }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { error } = await supabase
    .from("tasks")
    .update(data)
    .eq("id", taskId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function addComment(taskId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { error } = await supabase
    .from("task_comments")
    .insert({ task_id: taskId, user_id: user.id, content })

  if (error) return { error: error.message }

  // Disparar notificação para os responsáveis da task
  const { data: taskData } = await supabase
    .from("tasks")
    .select("title, project_id, creator_id, assignees:task_assignees(user_id)")
    .eq("id", taskId)
    .single()

  if (taskData) {
    const notifyUserIds = new Set<string>()
    if (taskData.creator_id && taskData.creator_id !== user.id) {
      notifyUserIds.add(taskData.creator_id)
    }
    taskData.assignees?.forEach((a: any) => {
      if (a.user_id !== user.id) notifyUserIds.add(a.user_id)
    })

    for (const targetUserId of notifyUserIds) {
      await createNotification({
        userId: targetUserId,
        title: "Novo comentário",
        message: `Novo comentário na tarefa "${taskData.title}"`,
        link: `/dashboard/projects/${taskData.project_id}`,
        type: "comment"
      })
    }
  }

  return { success: true }
}

export async function toggleAssignee(taskId: string, assigneeId: string, isAssigned: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  if (isAssigned) {
    const { error } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId)
      .eq("user_id", assigneeId)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from("task_assignees")
      .insert({ task_id: taskId, user_id: assigneeId })
    if (error) return { error: error.message }

    // Notificar o usuário atribuído
    const { data: taskData } = await supabase
      .from("tasks")
      .select("title, project_id")
      .eq("id", taskId)
      .single()

    if (taskData && assigneeId !== user.id) {
      await createNotification({
        userId: assigneeId,
        title: "Nova tarefa atribuída",
        message: `Você foi atribuído como responsável pela tarefa "${taskData.title}"`,
        link: `/dashboard/projects/${taskData.project_id}`,
        type: "task_assigned"
      })
    }
  }
  
  return { success: true }
}
