"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateTaskPosition(
  taskId: string,
  newColumnId: string,
  newPosition: number
) {
  const supabase = await createClient()

  // First verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { error } = await supabase
    .from("tasks")
    .update({ column_id: newColumnId, position: newPosition })
    .eq("id", taskId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateColumnPosition(
  columnId: string,
  newPosition: number
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado." }

  const { error } = await supabase
    .from("columns")
    .update({ position: newPosition })
    .eq("id", columnId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function createColumn(projectId: string, title: string, position: number) {
  const supabase = await createClient()
  
  const { data: column, error } = await supabase
    .from("columns")
    .insert({ project_id: projectId, title, position })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: column }
}

export async function createTask(projectId: string, columnId: string, title: string, position: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ 
      project_id: projectId, 
      column_id: columnId, 
      title, 
      position,
      creator_id: user?.id,
      priority: 'Medium',
      status: 'Open'
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { data: task }
}
