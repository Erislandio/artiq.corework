import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "./ProfileForm"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  // Fetch current user details
  const { data: currentUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single()

  // Fetch all users to populate the "Gerenciado por" dropdown (excluding current user)
  const { data: managers } = await supabase
    .from("users")
    .select("*")
    .neq("id", authUser.id)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Perfil</h1>
        <p className="text-sm text-zinc-500">
          Gerencie suas informações pessoais, cargo e preferências da conta.
        </p>
      </div>

      {currentUser && (
        <ProfileForm 
          user={currentUser} 
          availableManagers={managers || []} 
        />
      )}
    </div>
  )
}
