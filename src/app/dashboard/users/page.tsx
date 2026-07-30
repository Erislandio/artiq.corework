import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UserTable } from "./UserTable"

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/login")
  }

  // Verificar se é Admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch all users ordered by creation date
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-sm text-zinc-500">
          Visualize, edite as permissões ou remova usuários da plataforma.
        </p>
      </div>

      <UserTable 
        users={users || []} 
        currentUserId={authUser.id} 
      />
    </div>
  )
}
