"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createNotification(params: {
  userId: string
  title: string
  message: string
  link?: string
  type?: string
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      link: params.link || null,
      type: params.type || "info"
    })

  if (error) {
    console.error("Erro ao criar notificação:", error)
  }
}

/**
 * Notifica todos os responsáveis (assignees) de uma task, exceto o usuário que disparou a ação.
 */
export async function notifyTaskAssignees(params: {
  taskId: string
  excludeUserId: string
  title: string
  message: string
  type: string
}) {
  const supabase = await createClient()

  const { data: taskData } = await supabase
    .from("tasks")
    .select("title, project_id, creator_id, assignees:task_assignees(user_id)")
    .eq("id", params.taskId)
    .single()

  if (!taskData) return

  const notifyUserIds = new Set<string>()

  // Incluir o criador da task
  if (taskData.creator_id && taskData.creator_id !== params.excludeUserId) {
    notifyUserIds.add(taskData.creator_id)
  }

  // Incluir todos os assignees
  taskData.assignees?.forEach((a: any) => {
    if (a.user_id !== params.excludeUserId) notifyUserIds.add(a.user_id)
  })

  for (const targetUserId of notifyUserIds) {
    await createNotification({
      userId: targetUserId,
      title: params.title,
      message: params.message,
      link: `/dashboard/projects/${taskData.project_id}`,
      type: params.type
    })
  }
}

export async function getUserNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return data || []
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id)

  revalidatePath("/dashboard")
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  revalidatePath("/dashboard")
}

/**
 * Dispara notificação de upload de anexo para os assignees da task.
 */
export async function notifyAttachmentUploaded(taskId: string, fileName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Buscar nome do usuário
  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single()

  const userName = profile?.name || "Alguém"

  await notifyTaskAssignees({
    taskId,
    excludeUserId: user.id,
    title: "Novo anexo",
    message: `${userName} enviou o arquivo "${fileName}"`,
    type: "attachment"
  })
}
