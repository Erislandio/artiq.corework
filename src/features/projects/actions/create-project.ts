"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createProject(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const organization_id = formData.get("organization_id") as string

  if (!name || !organization_id) {
    return { error: "Nome e Organização são obrigatórios." }
  }

  // Obter o usuário logado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Usuário não autenticado." }
  }

  // Criar o projeto
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name,
      description,
      organization_id,
      status: "Active"
    })
    .select()
    .single()

  if (projectError) {
    return { error: "Falha ao criar projeto: " + projectError.message }
  }

  // Adicionar o usuário como membro do projeto
  await supabase
    .from("project_members")
    .insert({
      project_id: project.id,
      user_id: user.id,
    })

  revalidatePath("/dashboard/projects")
  return { success: true }
}
