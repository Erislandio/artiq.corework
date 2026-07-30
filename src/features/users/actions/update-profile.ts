"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserProfile(data: {
  name: string
  job_title?: string
  description?: string
  responsible_for?: string
  manager_id?: string | null
  avatar?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Não autenticado." }
  }

  const updatePayload: any = {
    name: data.name,
    job_title: data.job_title || null,
    description: data.description || null,
    responsible_for: data.responsible_for || null,
    manager_id: data.manager_id || null,
    updated_at: new Date().toISOString()
  }

  if (data.avatar) {
    updatePayload.avatar = data.avatar
  }

  const { error } = await supabase
    .from("users")
    .update(updatePayload)
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
  return { success: true }
}
