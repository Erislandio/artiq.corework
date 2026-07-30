import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LiveWorkBoard } from "@/features/live-work/components/LiveWorkBoard"

export default async function LiveWorkPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (userData?.role !== "Admin") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6 pb-12 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Trabalho Atual</h1>
        <p className="text-sm text-zinc-500">
          Acompanhe em tempo real as tarefas que sua equipe está executando neste exato momento.
        </p>
      </div>

      <div className="flex-1">
        <LiveWorkBoard />
      </div>
    </div>
  )
}
