"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  if (!name) {
    return { error: "Nome é obrigatório." }
  }

  // Obter o usuário logado
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Usuário não autenticado." }
  }

  // 1. Criar a organização
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      description,
    })
    .select()
    .single()

  if (orgError) {
    return { error: "Falha ao criar organização: " + orgError.message }
  }

  // 2. Adicionar o usuário logado como membro (Admin implicitamente na UI depois)
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organization.id,
      user_id: user.id,
    })

  if (memberError) {
    // Fazer rollback seria o ideal, mas para simplificar, apenas retornamos erro
    return { error: "Falha ao adicionar membro: " + memberError.message }
  }

  revalidatePath("/dashboard/organizations")
  return { success: true }
}
