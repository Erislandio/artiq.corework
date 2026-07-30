"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function deleteOrganization(organizationId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard/organizations")
  revalidatePath("/dashboard/projects")
  return { success: true }
}
