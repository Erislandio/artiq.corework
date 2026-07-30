"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateUserRole(userId: string, newRole: "Admin" | "Member") {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { error: "Não autenticado." }
  }

  const { error } = await supabase
    .from("users")
    .update({ 
      role: newRole,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { error: "Não autenticado." }
  }

  // Prevenir que o usuário se delete a si mesmo acidentalmente por esta ação
  if (currentUser.id === userId) {
    return { error: "Você não pode excluir seu próprio usuário por esta tela." }
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/users")
  return { success: true }
}
