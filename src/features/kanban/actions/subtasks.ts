"use server"

import { createClient } from "@/lib/supabase/server"

export async function createSubtask(taskId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { data, error } = await supabase
    .from("subtasks")
    .insert({
      task_id: taskId,
      title,
      is_completed: false
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { success: true, data }
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { error } = await supabase
    .from("subtasks")
    .update({ is_completed: isCompleted })
    .eq("id", subtaskId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteSubtask(subtaskId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { error } = await supabase
    .from("subtasks")
    .delete()
    .eq("id", subtaskId)

  if (error) return { error: error.message }
  return { success: true }
}
