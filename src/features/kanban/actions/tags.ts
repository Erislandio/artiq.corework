"use server"

import { createClient } from "@/lib/supabase/server"

export async function getProjectTags(projectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("project_id", projectId)
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar tags do projeto:", error)
    return []
  }

  return data
}

export async function createTag(projectId: string, name: string, color: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tags")
    .insert({
      project_id: projectId,
      name,
      color
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, tag: data }
}

export async function assignTagToTask(taskId: string, tagId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("task_tags")
    .insert({
      task_id: taskId,
      tag_id: tagId
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId)
    .eq("tag_id", tagId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateTag(tagId: string, name: string, color: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tags")
    .update({ name, color })
    .eq("id", tagId)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, tag: data }
}

export async function deleteTag(tagId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", tagId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

