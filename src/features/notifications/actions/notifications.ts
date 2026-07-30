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
